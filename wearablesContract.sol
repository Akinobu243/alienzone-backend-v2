// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";


// Errors
error InvalidFeePercent();
error InvalidSignature();
error InvalidOperator();
error InsufficientBaseUnit();
error AmountNotMultipleOfBaseUnit();
error InvalidTotalSupply();
error InvalidCurveFactor();
error InvalidInitialPriceFactor();
error WearableAlreadyCreated();
error WearableNotCreated();
error InvalidSaleState();
error TotalSupplyExceeded();
error InsufficientPayment();
error ExcessivePayment();
error SendFundsFailed();
error InsufficientHoldings();
error TransferToZeroAddress();
error IncorrectSender();
error InsufficientAllowance();
error ZoneTokenNotSet();

/**
 * @title AlienzoneWearables
 * @author lixingyu.eth <@0xlxy>
 * @dev Modified version that uses ZONE tokens instead of ETH
 */
contract AlienzoneWearables is Initializable, Ownable {
    using ECDSA for bytes32;

    enum SaleStates {
        PRIVATE,
        PUBLIC
    }

    // 3% in bps
    uint16 private constant CREATOR_FEE_BPS_DEFAULT = 300;
    // 2.5% in bps
    uint16 private constant PROTOCOL_FEE_BPS_DEFAULT = 250;

    // Max combined fee = 20% (2000 bps)
    uint16 private constant MAX_COMBINED_FEE_BPS = 2000;

    // Base unit of a wearable. 1000 fractional shares = 1 full wearable
    uint256 private constant BASE_WEARABLE_UNIT = 0.001 ether;

    // ZONE token contract
    IERC20 public zoneToken;

    // Address of the protocol fee destination
    address public protocolFeeDestination;

    // Percentages (in bps)
    uint16 public protocolFeeBps;
    uint16 public creatorFeeBps;

    // Address that signs messages used for creating wearables and private sales
    address public wearableSigner;

    // Address that signs messages used for creating wearables
    address public wearableOperator;

    event ProtocolFeeDestinationUpdated(address feeDestination);
    event ProtocolFeeBpsUpdated(uint256 feePercent);
    event CreatorFeeBpsUpdated(uint256 feePercent);
    event WearableSignerUpdated(address signer);
    event WearableOperatorUpdated(address operator);
    event ZoneTokenUpdated(address zoneToken);
    event WearableSaleStateUpdated(bytes32 wearablesSubject, SaleStates saleState);

    event WearableCreated(
        address creator,
        bytes32 subject,
        string name,
        string metadata,
        WearableFactors factors,
        SaleStates state
    );

    event Trade(
        address trader,
        bytes32 subject,
        bool isBuy,
        bool isPublic,
        uint256 wearableAmount,
        uint256 zoneAmount,
        uint256 protocolZoneAmount,
        uint256 creatorZoneAmount,
        uint256 supply
    );

    event NonceUpdated(address user, uint256 nonce);
    event WearableTransferred(address from, address to, bytes32 subject, uint256 amount);

    struct WearableFactors {
        uint256 supplyFactor;
        uint256 curveFactor;
        uint256 initialPriceFactor;
    }
    // ["0x6d3554127a699c8b8d433dac37934c5cd8969fd0", "test5", "https://api.alienzone.io/api/v1/wearables/5.json", true, 1, 1000, 100]
    // ["0x5B38Da6a701c568545dCfcB03FcB875f56beddC4", "test6", "https://api.alienzone.io/api/v1/wearables/6.json", true, 1, 1000, 100]
    // ["0x5B38Da6a701c568545dCfcB03FcB875f56beddC4", "test6", "https://api.alienzone.io/api/v1/wearables/6.json", true, 1000, 100, 10000000000000000000]
    // ["0x5B38Da6a701c568545dCfcB03FcB875f56beddC4", "test7", "https://api.alienzone.io/api/v1/wearables/6.json", true, 500, 100, 5000000000000000000] 
    // [
    //     "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
    //     "test6",
    //     "https://api.alienzone.io/api/v1/wearables/6.json",
    //     true,
    //     25,
    //     1,
    //     960
    // ]
    struct CreateWearableParams {
        address creator;
        string name;
        string metadata;
        bool isPublic;
        uint256 supplyFactor;
        uint256 curveFactor;
        uint256 initialPriceFactor;
    }

    struct Wearable {
        address creator;
        string name;
        string metadata;
        WearableFactors factors;
        SaleStates state;
    }

    // wearablesSubject => Wearable
    mapping(bytes32 => Wearable) public wearables;

    // wearablesSubject => (holder => balance)
    mapping(bytes32 => mapping(address => uint256)) public wearablesBalance;

    // wearablesSubject => supply
    mapping(bytes32 => uint256) public wearablesSupply;

    // userAddress => nonce
    mapping(address => uint256) public nonces;

    constructor(address Owner) Ownable(Owner) {}

    function initialize(address _wearableOperator, address _signer, address _zoneToken, address _protocolFeeDestination) public {
        // Configure protocol settings
        protocolFeeDestination = _protocolFeeDestination;
        protocolFeeBps = PROTOCOL_FEE_BPS_DEFAULT;
        creatorFeeBps = CREATOR_FEE_BPS_DEFAULT;
        wearableOperator = _wearableOperator;
        wearableSigner = _signer;
        zoneToken = IERC20(_zoneToken);
    }

    // =========================================================================
    //                          Protocol Settings
    // =========================================================================

    /// @dev Sets the ZONE token address.
    /// Emits a {ZoneTokenUpdated} event.
    function setZoneToken(address _zoneToken) external onlyOwner {
        if (_zoneToken == address(0)) revert TransferToZeroAddress();
        zoneToken = IERC20(_zoneToken);
        emit ZoneTokenUpdated(_zoneToken);
    }

    /// @dev Sets the protocol fee destination.
    /// Emits a {ProtocolFeeDestinationUpdated} event.
    function setProtocolFeeDestination(address _feeDestination) external onlyOwner {
        protocolFeeDestination = _feeDestination;
        emit ProtocolFeeDestinationUpdated(_feeDestination);
    }

    /// @dev Sets the protocol fee percentage.
    /// Emits a {ProtocolFeeBpsUpdated} event. Example: 2.5% = 250 bps
    function setProtocolFeeBps(uint16 _feeBps) external onlyOwner {
        if (uint256(_feeBps) + uint256(creatorFeeBps) > MAX_COMBINED_FEE_BPS) revert InvalidFeePercent();
        protocolFeeBps = _feeBps;
        emit ProtocolFeeBpsUpdated(_feeBps);
    }

    /// @dev Sets the creator fee percentage.
    /// Emits a {CreatorFeeBpsPercentUpdated} event. Example: 2.5% = 250 bps
    function setCreatorFeeBps(uint16 _feeBps) external onlyOwner {
        if (uint256(_feeBps) + uint256(protocolFeeBps) > MAX_COMBINED_FEE_BPS) revert InvalidFeePercent();
        creatorFeeBps = _feeBps;
        emit CreatorFeeBpsUpdated(_feeBps);
    }

    /// @dev Sets the signer address.
    /// Emits a {WearableSignerUpdated} event.
    function setWearableSigner(address _signer) external onlyOwner {
        wearableSigner = _signer;
        emit WearableSignerUpdated(_signer);
    }

    /// @dev Sets the operator address.
    /// Emits a {WearableOperatorUpdated} event.
    function setWearableOperator(address _operator) external onlyOwner {
        wearableOperator = _operator;
        emit WearableOperatorUpdated(_operator);
    }

    // =========================================================================
    //                          Create Wearable Logic
    // =========================================================================

    /// @dev Creates a sofamon wearable. operator only.
    /// Emits a {WearableCreated} event.
    function createWearable(CreateWearableParams calldata params) external {
        {
            if (msg.sender != wearableOperator) {
                revert InvalidOperator();
            }

            if (params.supplyFactor < 1 || params.supplyFactor > 10000) {
                revert InvalidTotalSupply();
            }

            if (params.curveFactor < 1 || params.curveFactor > 1000) {
                revert InvalidCurveFactor();
            }

            if (params.initialPriceFactor < 1 ether || params.initialPriceFactor > 1_000_000 ether) {
                revert InvalidInitialPriceFactor();
            }

        }

        // Generate wearable subject
        bytes32 wearablesSubject = keccak256(abi.encode(params.name, params.metadata));

        // Check if wearable already exists
        if (wearables[wearablesSubject].creator != address(0)) revert WearableAlreadyCreated();

        SaleStates state = params.isPublic ? SaleStates.PUBLIC : SaleStates.PRIVATE;

        // Update wearables mapping
        WearableFactors memory factors =
            WearableFactors(params.supplyFactor, params.curveFactor, params.initialPriceFactor);
        wearables[wearablesSubject] =
            Wearable(params.creator, params.name, params.metadata, factors, state);

        emit WearableCreated(
            params.creator, wearablesSubject, params.name, params.metadata, factors, state
        );
    }

    // =========================================================================
    //                          Wearables Settings
    // =========================================================================
    
    /// @dev Sets the sale state of a wearable. operator only.
    /// Emits a {WearableSaleStateUpdated} event.
    function setWearableSalesState(bytes32 wearablesSubject, SaleStates saleState) external {
        if (msg.sender != wearableOperator) {
            revert InvalidOperator();
        }

        wearables[wearablesSubject].state = saleState;
        emit WearableSaleStateUpdated(wearablesSubject, saleState);
    }

    /// @dev Sets the sale state of multiple wearables in a batch. operator only.
    /// Emits multiple {WearableSaleStateUpdated} events.
    function batchSetWearableSalesState(bytes32[] calldata wearablesSubjects, SaleStates saleState) external {
        if (msg.sender != wearableOperator) {
            revert InvalidOperator();
        }

        for (uint256 i = 0; i < wearablesSubjects.length; i++) {
            wearables[wearablesSubjects[i]].state = saleState;
            emit WearableSaleStateUpdated(wearablesSubjects[i], saleState);
        }
    }

    // =========================================================================
    //                          Trade Wearable Logic
    // =========================================================================
    
    /// @dev Returns the curve of `x`
    // function _curve(uint256 x, uint256 totalSupply, uint256 curveFactor, uint256 initialPriceFactor)
    //     private
    //     pure
    //     returns (uint256)
    // {
    //     return (totalSupply * curveFactor * 1 ether) / (totalSupply - x) - curveFactor * 1 ether
    //         - initialPriceFactor * x / 1000;
    // }

    function _curve(
        uint256 x,
        uint256 totalSupply,
        uint256 curveFactor,
        uint256 initialPriceFactor  // interpreted as price per full wearable in wei
    ) internal pure returns (uint256) {
        uint256 curvePrice = ((totalSupply * curveFactor * 1e18) / (totalSupply - x))
                            - (curveFactor * 1e18);

        // Scale so "initialPriceFactor" = price per 1 full wearable (1 ether supply)
        uint256 basePrice = (initialPriceFactor * x) / 1 ether;

        return curvePrice + basePrice;
    }


    /// @dev Returns the price based on `supply` and `amount`.
    function getPrice(
        uint256 supply,
        uint256 amount,
        uint256 totalSupply,
        uint256 curveFactor,
        uint256 initialPriceFactor,
        bool isBuy
    ) public pure returns (uint256) {
        if (isBuy && supply + amount >= totalSupply) {
            revert TotalSupplyExceeded();
        }

        if (!isBuy && supply >= totalSupply) {
            revert TotalSupplyExceeded();
        }

        return _curve(supply + amount, totalSupply, curveFactor, initialPriceFactor)
            - _curve(supply, totalSupply, curveFactor, initialPriceFactor);
    }

    /// @dev Returns the buy price of `amount` of `wearablesSubject`.
    function getBuyPrice(bytes32 wearablesSubject, uint256 amount) public view returns (uint256) {
        uint256 supplyFactor = wearables[wearablesSubject].factors.supplyFactor;
        uint256 curveFactor = wearables[wearablesSubject].factors.curveFactor;
        uint256 initialPriceFactor = wearables[wearablesSubject].factors.initialPriceFactor;
        return getPrice(
            wearablesSupply[wearablesSubject], amount, supplyFactor * 1 ether, curveFactor, initialPriceFactor, true
        );
    }

    /// @dev Returns the sell price of `amount` of `wearablesSubject`.
    function getSellPrice(bytes32 wearablesSubject, uint256 amount) public view returns (uint256) {
        uint256 supplyFactor = wearables[wearablesSubject].factors.supplyFactor;
        uint256 curveFactor = wearables[wearablesSubject].factors.curveFactor;
        uint256 initialPriceFactor = wearables[wearablesSubject].factors.initialPriceFactor;
        return getPrice(
            wearablesSupply[wearablesSubject] - amount,
            amount,
            supplyFactor * 1 ether,
            curveFactor,
            initialPriceFactor,
            false
        );
    }

    /// @dev Returns the buy price of `amount` of `wearablesSubject` after fee.
    function getBuyPriceAfterFee(bytes32 wearablesSubject, uint256 amount) external view returns (uint256) {
        // Get buy price before fee
        uint256 price = getBuyPrice(wearablesSubject, amount);

        // Get protocol fee
        uint256 protocolFee = _getProtocolFee(price, true);

        // Get creator fee
        uint256 creatorFee = _getCreatorFee(price, true);

        // Get final buy price
        return price + protocolFee + creatorFee;
    }

    /// @dev Returns the sell price of `amount` of `wearablesSubject` after fee.
    function getSellPriceAfterFee(bytes32 wearablesSubject, uint256 amount) external view returns (uint256) {
        // Get sell price before fee
        uint256 price = getSellPrice(wearablesSubject, amount);

        // Get protocol fee
        uint256 protocolFee = _getProtocolFee(price, false);

        // Get creator fee
        uint256 creatorFee = _getCreatorFee(price, false);

        // Get final sell price
        return price - protocolFee - creatorFee;
    }

    /// @dev Returns the protocol fee.
    function _getProtocolFee(uint256 price, bool roundUp) internal view returns (uint256) {
        return Math.mulDiv(price, protocolFeeBps, 10_000, roundUp ? Math.Rounding.Ceil : Math.Rounding.Floor);
    }

    /// @dev Returns the creator fee.
    function _getCreatorFee(uint256 price, bool roundUp) internal view returns (uint256) {
        return Math.mulDiv(price, creatorFeeBps, 10_000, roundUp ? Math.Rounding.Ceil : Math.Rounding.Floor);
    }

    /// @dev Returns the nonce of `user`.
    function getUserNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    /// @dev Buys `amount` of `wearablesSubject` using ZONE tokens.
    /// Emits a {Trade} event.
    function buyWearables(bytes32 wearablesSubject, uint256 amount) external {
        {
            // Check if ZONE token is set
            if (address(zoneToken) == address(0)) revert ZoneTokenNotSet();

            // Check if amount is greater than base unit
            if (amount < BASE_WEARABLE_UNIT) revert InsufficientBaseUnit();

            // Check if amount is a multiple of the base unit
            if (amount % BASE_WEARABLE_UNIT != 0) revert AmountNotMultipleOfBaseUnit();

            // Check if wearable exists
            if (wearables[wearablesSubject].creator == address(0)) revert WearableNotCreated();

            // Check if sale state is public
            if (wearables[wearablesSubject].state != SaleStates.PUBLIC) revert InvalidSaleState();
        }

        _buyWearables(wearablesSubject, amount, true);
    }

    /// @dev Buys `amount` of `wearablesSubject` with a signature using ZONE tokens.
    /// Emits a {NonceUpdated} {Trade} event.
    function buyPrivateWearables(bytes32 wearablesSubject, uint256 amount, bytes calldata signature) external {
        {
            // Check if ZONE token is set
            if (address(zoneToken) == address(0)) revert ZoneTokenNotSet();

            // Check if amount is greater than base unit
            if (amount < BASE_WEARABLE_UNIT) revert InsufficientBaseUnit();

            // Check if amount is a multiple of the base unit
            if (amount % BASE_WEARABLE_UNIT != 0) revert AmountNotMultipleOfBaseUnit();

            // Check if wearable exists
            if (wearables[wearablesSubject].creator == address(0)) revert WearableNotCreated();

            // Check if sale state is private
            if (wearables[wearablesSubject].state != SaleStates.PRIVATE) revert InvalidSaleState();

            uint256 nonce = nonces[msg.sender];
            // Validate signature
            bytes32 hashVal = keccak256(abi.encodePacked(msg.sender, "buy", wearablesSubject, amount, nonce));

            if (ECDSA.recover(hashVal, signature) != wearableSigner) {
                revert InvalidSignature();
            }

            nonces[msg.sender] += 1;
            emit NonceUpdated(msg.sender, nonces[msg.sender]);
        }

        _buyWearables(wearablesSubject, amount, false);
    }

    /// @dev Internal buys `amount` of `wearablesSubject` using ZONE tokens.
    function _buyWearables(bytes32 wearablesSubject, uint256 amount, bool isPublic) internal {
        uint256 supply = wearablesSupply[wearablesSubject];

        // Get buy price before fee
        uint256 price = getPrice(
            supply,
            amount,
            wearables[wearablesSubject].factors.supplyFactor * 1 ether,
            wearables[wearablesSubject].factors.curveFactor,
            wearables[wearablesSubject].factors.initialPriceFactor,
            true
        );

        // Get protocol fee
        uint256 protocolFee = _getProtocolFee(price, true);

        // Get creator fee
        uint256 creatorFee = _getCreatorFee(price, true);

        uint256 totalCost = price + protocolFee + creatorFee;

        // Check if user has enough ZONE tokens
        if (zoneToken.balanceOf(msg.sender) < totalCost) {
            revert InsufficientPayment();
        }

        // Check if user has given enough allowance
        if (zoneToken.allowance(msg.sender, address(this)) < totalCost) {
            revert InsufficientAllowance();
        }

        // Update wearables balance and supply
        wearablesBalance[wearablesSubject][msg.sender] = wearablesBalance[wearablesSubject][msg.sender] + amount;
        wearablesSupply[wearablesSubject] = supply + amount;

        // Get creator fee destination
        address creatorFeeDestination = wearables[wearablesSubject].creator;

        uint256 newSupply = supply + amount;

        emit Trade(
            msg.sender, wearablesSubject, true, isPublic, amount, price, protocolFee, creatorFee, newSupply 
        );

        require(protocolFeeDestination != address(0), "Protocol fee destination is not set");
        require(creatorFeeDestination != address(0), "Creator fee destination is not set");

        bool success1 = zoneToken.transferFrom(msg.sender, address(this), totalCost);
        bool success2 = zoneToken.transfer(protocolFeeDestination, protocolFee);
        bool success3 = zoneToken.transfer(creatorFeeDestination, creatorFee);

        if (!(success1 && success2 && success3)) revert SendFundsFailed();
    }

    /// @dev Sells `amount` of `wearablesSubject` for ZONE tokens.
    /// Emits a {Trade} event.
    function sellWearables(bytes32 wearablesSubject, uint256 amount) external {
        {
            // Check if ZONE token is set
            if (address(zoneToken) == address(0)) revert ZoneTokenNotSet();

            // Check if amount is greater than base unit
            if (amount < BASE_WEARABLE_UNIT) revert InsufficientBaseUnit();

            // Check if amount is a multiple of the base unit
            if (amount % BASE_WEARABLE_UNIT != 0) revert AmountNotMultipleOfBaseUnit();

            // Check if wearable exists
            if (wearables[wearablesSubject].creator == address(0)) revert WearableNotCreated();

            // Check if sale state is public
            if (wearables[wearablesSubject].state != SaleStates.PUBLIC) revert InvalidSaleState();
        }

        _sellWearables(wearablesSubject, amount, true);
    }

    /// @dev Sells `amount` of `wearablesSubject` with a signature for ZONE tokens.
    /// Emits a {NonceUpdated} {Trade} event.
    function sellPrivateWearables(bytes32 wearablesSubject, uint256 amount, bytes calldata signature) external {
        {
            // Check if ZONE token is set
            if (address(zoneToken) == address(0)) revert ZoneTokenNotSet();

            // Check if amount is greater than base unit
            if (amount < BASE_WEARABLE_UNIT) revert InsufficientBaseUnit();

            // Check if amount is a multiple of the base unit
            if (amount % BASE_WEARABLE_UNIT != 0) revert AmountNotMultipleOfBaseUnit();

            // Check if wearable exists
            if (wearables[wearablesSubject].creator == address(0)) revert WearableNotCreated();

            // Check if sale state is private
            if (wearables[wearablesSubject].state != SaleStates.PRIVATE) revert InvalidSaleState();

            uint256 nonce = nonces[msg.sender];
            // Validate signature
            bytes32 hashVal = keccak256(abi.encodePacked(msg.sender, "sell", wearablesSubject, amount, nonce));
            if (ECDSA.recover(hashVal, signature) != wearableSigner) {
                revert InvalidSignature();
            }

            nonces[msg.sender] += 1;
            emit NonceUpdated(msg.sender, nonces[msg.sender]);
        }

        _sellWearables(wearablesSubject, amount, false);
    }

    /// @dev Internal sells `amount` of `wearablesSubject` for ZONE tokens.
    function _sellWearables(bytes32 wearablesSubject, uint256 amount, bool isPublic) internal {
        uint256 supply = wearablesSupply[wearablesSubject];

        // Get sell price before fee
        uint256 price = getPrice(
            supply - amount,
            amount,
            wearables[wearablesSubject].factors.supplyFactor * 1 ether,
            wearables[wearablesSubject].factors.curveFactor,
            wearables[wearablesSubject].factors.initialPriceFactor,
            false
        );

        // Get protocol fee
        uint256 protocolFee = _getProtocolFee(price, false);

        // Get creator fee
        uint256 creatorFee = _getCreatorFee(price, false);

        // Check if user has enough amount for sale
        if (wearablesBalance[wearablesSubject][msg.sender] < amount) {
            revert InsufficientHoldings();
        }

        // Check if contract has enough ZONE tokens
        if (zoneToken.balanceOf(address(this)) < price - protocolFee - creatorFee) {
            revert InsufficientPayment();
        }

        // Update wearables balance and supply
        wearablesBalance[wearablesSubject][msg.sender] = wearablesBalance[wearablesSubject][msg.sender] - amount;
        wearablesSupply[wearablesSubject] = supply - amount;

        // Get creator fee destination
        address creatorFeeDestination = wearables[wearablesSubject].creator;

        emit Trade(
            msg.sender, wearablesSubject, false, isPublic, amount, price, protocolFee, creatorFee, supply - amount
        );

        require(protocolFeeDestination != address(0), "Protocol fee destination is not set");
        require(creatorFeeDestination != address(0), "Creator fee destination is not set");

        // if (zoneToken.allowance(address(this), address(this)) < price + protocolFee + creatorFee) {
        //     zoneToken.approve(address(this), (price + protocolFee + creatorFee) * 10);
        // }

        bool success1 = zoneToken.transfer(msg.sender, price - protocolFee - creatorFee);
        bool success2 = zoneToken.transfer(protocolFeeDestination, protocolFee);
        bool success3 = zoneToken.transfer(creatorFeeDestination, creatorFee);

        if (!(success1 && success2 && success3)) revert SendFundsFailed();
    }
    /// @dev Transfers `amount` of `wearablesSubject` from `from` to `to`.
    /// Emits a {WearableTransferred} event.
    function transferWearables(bytes32 wearablesSubject, address from, address to, uint256 amount) external {
        // Check if to address is non-zero
        if (to == address(0)) revert TransferToZeroAddress();

        // Check if amount is greater than base unit
        if (amount < BASE_WEARABLE_UNIT) revert InsufficientBaseUnit();

        // Check if amount is a multiple of the base unit
        if (amount % BASE_WEARABLE_UNIT != 0) revert AmountNotMultipleOfBaseUnit();

        // Check if message sender is the from address
        if (_msgSender() != from) revert IncorrectSender();

        // Check if user has enough wearables for transfer
        if (wearablesBalance[wearablesSubject][from] < amount) {
            revert InsufficientHoldings();
        }

        // Update wearables balance and supply
        wearablesBalance[wearablesSubject][from] = wearablesBalance[wearablesSubject][from] - amount;
        wearablesBalance[wearablesSubject][to] = wearablesBalance[wearablesSubject][to] + amount;

        emit WearableTransferred(from, to, wearablesSubject, amount);
    }

    /// @dev Allows the owner to withdraw ZONE tokens from the contract
    function withdrawZoneTokens(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert TransferToZeroAddress();
        zoneToken.transfer(to, amount);
    }
} 