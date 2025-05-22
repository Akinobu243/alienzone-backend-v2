/**
 *Submitted for verification at Etherscan.io on 2025-04-17
*/

// SPDX-License-Identifier: MIT
// File: @openzeppelin/contracts/utils/cryptography/ECDSA.sol


// OpenZeppelin Contracts (last updated v5.1.0) (utils/cryptography/ECDSA.sol)

pragma solidity ^0.8.26;

/**
 * @dev Elliptic Curve Digital Signature Algorithm (ECDSA) operations.
 *
 * These functions can be used to verify that a message was signed by the holder
 * of the private keys of a given address.
 */
library ECDSA {
    enum RecoverError {
        NoError,
        InvalidSignature,
        InvalidSignatureLength,
        InvalidSignatureS
    }

    /**
     * @dev The signature derives the `address(0)`.
     */
    error ECDSAInvalidSignature();

    /**
     * @dev The signature has an invalid length.
     */
    error ECDSAInvalidSignatureLength(uint256 length);

    /**
     * @dev The signature has an S value that is in the upper half order.
     */
    error ECDSAInvalidSignatureS(bytes32 s);

    /**
     * @dev Returns the address that signed a hashed message (`hash`) with `signature` or an error. This will not
     * return address(0) without also returning an error description. Errors are documented using an enum (error type)
     * and a bytes32 providing additional information about the error.
     *
     * If no error is returned, then the address can be used for verification purposes.
     *
     * The `ecrecover` EVM precompile allows for malleable (non-unique) signatures:
     * this function rejects them by requiring the `s` value to be in the lower
     * half order, and the `v` value to be either 27 or 28.
     *
     * IMPORTANT: `hash` _must_ be the result of a hash operation for the
     * verification to be secure: it is possible to craft signatures that
     * recover to arbitrary addresses for non-hashed data. A safe way to ensure
     * this is by receiving a hash of the original message (which may otherwise
     * be too long), and then calling {MessageHashUtils-toEthSignedMessageHash} on it.
     *
     * Documentation for signature generation:
     * - with https://web3js.readthedocs.io/en/v1.3.4/web3-eth-accounts.html#sign[Web3.js]
     * - with https://docs.ethers.io/v5/api/signer/#Signer-signMessage[ethers]
     */
    function tryRecover(
        bytes32 hash,
        bytes memory signature
    ) internal pure returns (address recovered, RecoverError err, bytes32 errArg) {
        if (signature.length == 65) {
            bytes32 r;
            bytes32 s;
            uint8 v;
            // ecrecover takes the signature parameters, and the only way to get them
            // currently is to use assembly.
            assembly ("memory-safe") {
                r := mload(add(signature, 0x20))
                s := mload(add(signature, 0x40))
                v := byte(0, mload(add(signature, 0x60)))
            }
            return tryRecover(hash, v, r, s);
        } else {
            return (address(0), RecoverError.InvalidSignatureLength, bytes32(signature.length));
        }
    }

    /**
     * @dev Returns the address that signed a hashed message (`hash`) with
     * `signature`. This address can then be used for verification purposes.
     *
     * The `ecrecover` EVM precompile allows for malleable (non-unique) signatures:
     * this function rejects them by requiring the `s` value to be in the lower
     * half order, and the `v` value to be either 27 or 28.
     *
     * IMPORTANT: `hash` _must_ be the result of a hash operation for the
     * verification to be secure: it is possible to craft signatures that
     * recover to arbitrary addresses for non-hashed data. A safe way to ensure
     * this is by receiving a hash of the original message (which may otherwise
     * be too long), and then calling {MessageHashUtils-toEthSignedMessageHash} on it.
     */
    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        (address recovered, RecoverError error, bytes32 errorArg) = tryRecover(hash, signature);
        _throwError(error, errorArg);
        return recovered;
    }

    /**
     * @dev Overload of {ECDSA-tryRecover} that receives the `r` and `vs` short-signature fields separately.
     *
     * See https://eips.ethereum.org/EIPS/eip-2098[ERC-2098 short signatures]
     */
    function tryRecover(
        bytes32 hash,
        bytes32 r,
        bytes32 vs
    ) internal pure returns (address recovered, RecoverError err, bytes32 errArg) {
        unchecked {
            bytes32 s = vs & bytes32(0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
            // We do not check for an overflow here since the shift operation results in 0 or 1.
            uint8 v = uint8((uint256(vs) >> 255) + 27);
            return tryRecover(hash, v, r, s);
        }
    }

    /**
     * @dev Overload of {ECDSA-recover} that receives the `r and `vs` short-signature fields separately.
     */
    function recover(bytes32 hash, bytes32 r, bytes32 vs) internal pure returns (address) {
        (address recovered, RecoverError error, bytes32 errorArg) = tryRecover(hash, r, vs);
        _throwError(error, errorArg);
        return recovered;
    }

    /**
     * @dev Overload of {ECDSA-tryRecover} that receives the `v`,
     * `r` and `s` signature fields separately.
     */
    function tryRecover(
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal pure returns (address recovered, RecoverError err, bytes32 errArg) {
        // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
        // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
        // the valid range for s in (301): 0 < s < secp256k1n ÷ 2 + 1, and for v in (302): v ∈ {27, 28}. Most
        // signatures from current libraries generate a unique signature with an s-value in the lower half order.
        //
        // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
        // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
        // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
        // these malleable signatures as well.
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            return (address(0), RecoverError.InvalidSignatureS, s);
        }

        // If the signature is valid (and not malleable), return the signer address
        address signer = ecrecover(hash, v, r, s);
        if (signer == address(0)) {
            return (address(0), RecoverError.InvalidSignature, bytes32(0));
        }

        return (signer, RecoverError.NoError, bytes32(0));
    }

    /**
     * @dev Overload of {ECDSA-recover} that receives the `v`,
     * `r` and `s` signature fields separately.
     */
    function recover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) internal pure returns (address) {
        (address recovered, RecoverError error, bytes32 errorArg) = tryRecover(hash, v, r, s);
        _throwError(error, errorArg);
        return recovered;
    }

    /**
     * @dev Optionally reverts with the corresponding custom error according to the `error` argument provided.
     */
    function _throwError(RecoverError error, bytes32 errorArg) private pure {
        if (error == RecoverError.NoError) {
            return; // no error: do nothing
        } else if (error == RecoverError.InvalidSignature) {
            revert ECDSAInvalidSignature();
        } else if (error == RecoverError.InvalidSignatureLength) {
            revert ECDSAInvalidSignatureLength(uint256(errorArg));
        } else if (error == RecoverError.InvalidSignatureS) {
            revert ECDSAInvalidSignatureS(errorArg);
        }
    }
}

// File: @openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol


// OpenZeppelin Contracts (last updated v5.0.0) (proxy/utils/Initializable.sol)

pragma solidity ^0.8.26;

/**
 * @dev This is a base contract to aid in writing upgradeable contracts, or any kind of contract that will be deployed
 * behind a proxy. Since proxied contracts do not make use of a constructor, it's common to move constructor logic to an
 * external initializer function, usually called `initialize`. It then becomes necessary to protect this initializer
 * function so it can only be called once. The {initializer} modifier provided by this contract will have this effect.
 *
 * The initialization functions use a version number. Once a version number is used, it is consumed and cannot be
 * reused. This mechanism prevents re-execution of each "step" but allows the creation of new initialization steps in
 * case an upgrade adds a module that needs to be initialized.
 *
 * For example:
 *
 * [.hljs-theme-light.nopadding]
 * ```solidity
 * contract MyToken is ERC20Upgradeable {
 *     function initialize() initializer public {
 *         __ERC20_init("MyToken", "MTK");
 *     }
 * }
 *
 * contract MyTokenV2 is MyToken, ERC20PermitUpgradeable {
 *     function initializeV2() reinitializer(2) public {
 *         __ERC20Permit_init("MyToken");
 *     }
 * }
 * ```
 *
 * TIP: To avoid leaving the proxy in an uninitialized state, the initializer function should be called as early as
 * possible by providing the encoded function call as the `_data` argument to {ERC1967Proxy-constructor}.
 *
 * CAUTION: When used with inheritance, manual care must be taken to not invoke a parent initializer twice, or to ensure
 * that all initializers are idempotent. This is not verified automatically as constructors are by Solidity.
 *
 * [CAUTION]
 * ====
 * Avoid leaving a contract uninitialized.
 *
 * An uninitialized contract can be taken over by an attacker. This applies to both a proxy and its implementation
 * contract, which may impact the proxy. To prevent the implementation contract from being used, you should invoke
 * the {_disableInitializers} function in the constructor to automatically lock it when it is deployed:
 *
 * [.hljs-theme-light.nopadding]
 * ```
 * /// @custom:oz-upgrades-unsafe-allow constructor
 * constructor() {
 *     _disableInitializers();
 * }
 * ```
 * ====
 */
abstract contract Initializable {
    /**
     * @dev Storage of the initializable contract.
     *
     * It's implemented on a custom ERC-7201 namespace to reduce the risk of storage collisions
     * when using with upgradeable contracts.
     *
     * @custom:storage-location erc7201:openzeppelin.storage.Initializable
     */
    struct InitializableStorage {
        /**
         * @dev Indicates that the contract has been initialized.
         */
        uint64 _initialized;
        /**
         * @dev Indicates that the contract is in the process of being initialized.
         */
        bool _initializing;
    }

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.Initializable")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant INITIALIZABLE_STORAGE = 0xf0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00;

    /**
     * @dev The contract is already initialized.
     */
    error InvalidInitialization();

    /**
     * @dev The contract is not initializing.
     */
    error NotInitializing();

    /**
     * @dev Triggered when the contract has been initialized or reinitialized.
     */
    event Initialized(uint64 version);

    /**
     * @dev A modifier that defines a protected initializer function that can be invoked at most once. In its scope,
     * `onlyInitializing` functions can be used to initialize parent contracts.
     *
     * Similar to `reinitializer(1)`, except that in the context of a constructor an `initializer` may be invoked any
     * number of times. This behavior in the constructor can be useful during testing and is not expected to be used in
     * production.
     *
     * Emits an {Initialized} event.
     */
    modifier initializer() {
        // solhint-disable-next-line var-name-mixedcase
        InitializableStorage storage $ = _getInitializableStorage();

        // Cache values to avoid duplicated sloads
        bool isTopLevelCall = !$._initializing;
        uint64 initialized = $._initialized;

        // Allowed calls:
        // - initialSetup: the contract is not in the initializing state and no previous version was
        //                 initialized
        // - construction: the contract is initialized at version 1 (no reininitialization) and the
        //                 current contract is just being deployed
        bool initialSetup = initialized == 0 && isTopLevelCall;
        bool construction = initialized == 1 && address(this).code.length == 0;

        if (!initialSetup && !construction) {
            revert InvalidInitialization();
        }
        $._initialized = 1;
        if (isTopLevelCall) {
            $._initializing = true;
        }
        _;
        if (isTopLevelCall) {
            $._initializing = false;
            emit Initialized(1);
        }
    }

    /**
     * @dev A modifier that defines a protected reinitializer function that can be invoked at most once, and only if the
     * contract hasn't been initialized to a greater version before. In its scope, `onlyInitializing` functions can be
     * used to initialize parent contracts.
     *
     * A reinitializer may be used after the original initialization step. This is essential to configure modules that
     * are added through upgrades and that require initialization.
     *
     * When `version` is 1, this modifier is similar to `initializer`, except that functions marked with `reinitializer`
     * cannot be nested. If one is invoked in the context of another, execution will revert.
     *
     * Note that versions can jump in increments greater than 1; this implies that if multiple reinitializers coexist in
     * a contract, executing them in the right order is up to the developer or operator.
     *
     * WARNING: Setting the version to 2**64 - 1 will prevent any future reinitialization.
     *
     * Emits an {Initialized} event.
     */
    modifier reinitializer(uint64 version) {
        // solhint-disable-next-line var-name-mixedcase
        InitializableStorage storage $ = _getInitializableStorage();

        if ($._initializing || $._initialized >= version) {
            revert InvalidInitialization();
        }
        $._initialized = version;
        $._initializing = true;
        _;
        $._initializing = false;
        emit Initialized(version);
    }

    /**
     * @dev Modifier to protect an initialization function so that it can only be invoked by functions with the
     * {initializer} and {reinitializer} modifiers, directly or indirectly.
     */
    modifier onlyInitializing() {
        _checkInitializing();
        _;
    }

    /**
     * @dev Reverts if the contract is not in an initializing state. See {onlyInitializing}.
     */
    function _checkInitializing() internal view virtual {
        if (!_isInitializing()) {
            revert NotInitializing();
        }
    }

    /**
     * @dev Locks the contract, preventing any future reinitialization. This cannot be part of an initializer call.
     * Calling this in the constructor of a contract will prevent that contract from being initialized or reinitialized
     * to any version. It is recommended to use this to lock implementation contracts that are designed to be called
     * through proxies.
     *
     * Emits an {Initialized} event the first time it is successfully executed.
     */
    function _disableInitializers() internal virtual {
        // solhint-disable-next-line var-name-mixedcase
        InitializableStorage storage $ = _getInitializableStorage();

        if ($._initializing) {
            revert InvalidInitialization();
        }
        if ($._initialized != type(uint64).max) {
            $._initialized = type(uint64).max;
            emit Initialized(type(uint64).max);
        }
    }

    /**
     * @dev Returns the highest version that has been initialized. See {reinitializer}.
     */
    function _getInitializedVersion() internal view returns (uint64) {
        return _getInitializableStorage()._initialized;
    }

    /**
     * @dev Returns `true` if the contract is currently initializing. See {onlyInitializing}.
     */
    function _isInitializing() internal view returns (bool) {
        return _getInitializableStorage()._initializing;
    }

    /**
     * @dev Returns a pointer to the storage namespace.
     */
    // solhint-disable-next-line var-name-mixedcase
    function _getInitializableStorage() private pure returns (InitializableStorage storage $) {
        assembly {
            $.slot := INITIALIZABLE_STORAGE
        }
    }
}

// File: @openzeppelin/contracts/utils/Context.sol


// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.26;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// File: @openzeppelin/contracts/access/Ownable.sol


// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.26;


/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// File: contracts/Alienzone-Store/sofamon.sol


pragma solidity ^0.8.19;





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

/**
 * @title SofamonWearables
 * @author lixingyu.eth <@0xlxy>
 */
contract SofamonWearables is Initializable, Ownable{
    using ECDSA for bytes32;

    enum SaleStates {
        PRIVATE,
        PUBLIC
    }

    // 3% creator fee
    uint256 private constant CREATOR_FEE_PERCENT = 0.03 ether;

    // 3% protocol fee
    uint256 private constant PROTOCOL_FEE_PERCENT = 0.03 ether;

    // Base unit of a wearable. 1000 fractional shares = 1 full wearable
    uint256 private constant BASE_WEARABLE_UNIT = 0.001 ether;

    // Address of the protocol fee destination
    address public protocolFeeDestination;

    // Percentage of the protocol fee
    uint256 public protocolFeePercent;

    // Percentage of the creator fee
    uint256 public creatorFeePercent;

    // Address that signs messages used for creating wearables and private sales
    address public wearableSigner;

    // Address that signs messages used for creating wearables
    address public wearableOperator;

    event ProtocolFeeDestinationUpdated(address feeDestination);

    event ProtocolFeePercentUpdated(uint256 feePercent);

    event CreatorFeePercentUpdated(uint256 feePercent);

    event WearableSignerUpdated(address signer);

    event WearableOperatorUpdated(address operator);

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
        uint256 ethAmount,
        uint256 protocolEthAmount,
        uint256 creatorEthAmount,
        uint256 supply
    );

    event NonceUpdated(address user, uint256 nonce);

    event WearableTransferred(address from, address to, bytes32 subject, uint256 amount);

    struct WearableFactors {
        uint256 supplyFactor;
        uint256 curveFactor;
        uint256 initialPriceFactor;
    }

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

    constructor(address Owner) Ownable(Owner)  {}

    function initialize(address _wearableOperator, address _signer) public {
        // Configure protocol settings
        protocolFeePercent = PROTOCOL_FEE_PERCENT;
        creatorFeePercent = CREATOR_FEE_PERCENT;
        wearableOperator = _wearableOperator;
        wearableSigner = _signer;
    }

    // =========================================================================
    //                          Protocol Settings
    // =========================================================================

    /// @dev Sets the protocol fee destination.
    /// Emits a {ProtocolFeeDestinationUpdated} event.
    function setProtocolFeeDestination(address _feeDestination) external onlyOwner {
        protocolFeeDestination = _feeDestination;
        emit ProtocolFeeDestinationUpdated(_feeDestination);
    }

    /// @dev Sets the protocol fee percentage.
    /// Emits a {ProtocolFeePercentUpdated} event.
    function setProtocolFeePercent(uint256 _feePercent) external onlyOwner {
        if (_feePercent + creatorFeePercent > 0.2 ether) revert InvalidFeePercent();

        protocolFeePercent = _feePercent;
        emit ProtocolFeePercentUpdated(_feePercent);
    }

    /// @dev Sets the creator fee percentage.
    /// Emits a {CreatorFeePercentUpdated} event.
    function setCreatorFeePercent(uint256 _feePercent) external onlyOwner {
        if (_feePercent + protocolFeePercent > 0.2 ether) revert InvalidFeePercent();

        creatorFeePercent = _feePercent;
        emit CreatorFeePercentUpdated(_feePercent);
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

            if (params.initialPriceFactor < 100 || params.initialPriceFactor > 1000) {
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
    function _curve(uint256 x, uint256 totalSupply, uint256 curveFactor, uint256 initialPriceFactor)
        private
        pure
        returns (uint256)
    {
        return (totalSupply * curveFactor * 1 ether) / (totalSupply - x) - curveFactor * 1 ether
            - initialPriceFactor * x / 1000;
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
        uint256 protocolFee = _getProtocolFee(price);

        // Get creator fee
        uint256 creatorFee = _getCreatorFee(price);

        // Get final buy price
        return price + protocolFee + creatorFee;
    }

    /// @dev Returns the sell price of `amount` of `wearablesSubject` after fee.
    function getSellPriceAfterFee(bytes32 wearablesSubject, uint256 amount) external view returns (uint256) {
        // Get sell price before fee
        uint256 price = getSellPrice(wearablesSubject, amount);

        // Get protocol fee
        uint256 protocolFee = _getProtocolFee(price);

        // Get creator fee
        uint256 creatorFee = _getCreatorFee(price);

        // Get final sell price
        return price - protocolFee - creatorFee;
    }

    /// @dev Returns the protocol fee.
    function _getProtocolFee(uint256 price) internal view returns (uint256) {
        return (price * protocolFeePercent) / 1 ether;
    }

    /// @dev Returns the creator fee.
    function _getCreatorFee(uint256 price) internal view returns (uint256) {
        return (price * creatorFeePercent) / 1 ether;
    }

    /// @dev Returns the nonce of `user`.
    function getUserNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    /// @dev Buys `amount` of `wearablesSubject`.
    /// Emits a {Trade} event.
    function buyWearables(bytes32 wearablesSubject, uint256 amount) external payable {
        {
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

    /// @dev Buys `amount` of `wearablesSubject` with a signature.
    /// Emits a {NonceUpdated} {Trade} event.
    function buyPrivateWearables(bytes32 wearablesSubject, uint256 amount, bytes calldata signature) external payable {
        {
            // Check if amount is greater than base unit
            if (amount < BASE_WEARABLE_UNIT) revert InsufficientBaseUnit();

            // Check if amount is a multiple of the base unit
            if (amount % BASE_WEARABLE_UNIT != 0) revert AmountNotMultipleOfBaseUnit();

            // Check if wearable exists
            if (wearables[wearablesSubject].creator == address(0)) revert WearableNotCreated();

            // Check if sale state is public
            if (wearables[wearablesSubject].state != SaleStates.PRIVATE) revert InvalidSaleState();

            uint256 nonce = nonces[msg.sender];
            // Validate signature
            bytes32 hashVal = keccak256(abi.encodePacked(msg.sender, "buy", wearablesSubject, amount, nonce));

            // bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
            // bytes32 signedHash = ECDSA.recover(ethSignedMessageHash, signature);
            // bytes32 signature = ECDSA.toEthSignedMessageHash(hashVal);
            // bytes32 msgHash = ECDSA.toEthSignedMessageHash(hashVal);
            // bytes32 signedHash = hashVal.toEthSignedMessageHash();

            if (ECDSA.recover(hashVal, signature) != wearableSigner) {
                revert InvalidSignature();
            }

            nonces[msg.sender] += 1;

            emit NonceUpdated(msg.sender, nonces[msg.sender]);
        }

        _buyWearables(wearablesSubject, amount, false);
    }

    /// @dev Internal buys `amount` of `wearablesSubject`.
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
        uint256 protocolFee = _getProtocolFee(price);

        // Get creator fee
        uint256 creatorFee = _getCreatorFee(price);

        // Check if user has enough funds
        if (msg.value < price + protocolFee + creatorFee) {
            revert InsufficientPayment();
        }

        // Check if user has excessive funds
        if (msg.value > price + protocolFee + creatorFee) {
            revert ExcessivePayment();
        }

        // Update wearables balance and supply
        wearablesBalance[wearablesSubject][msg.sender] = wearablesBalance[wearablesSubject][msg.sender] + amount;
        wearablesSupply[wearablesSubject] = supply + amount;

        // Get creator fee destination
        address creatorFeeDestination = wearables[wearablesSubject].creator;

        emit Trade(
            msg.sender, wearablesSubject, true, isPublic, amount, price, protocolFee, creatorFee, supply + amount
        );

        // Send protocol fee to protocol fee destination
        (bool success1,) = protocolFeeDestination.call{value: protocolFee}("");

        //Send creator fee to creator fee destination
        (bool success2,) = creatorFeeDestination.call{value: creatorFee}("");

        // Check if all funds were sent successfully
        if (!(success1 && success2)) revert SendFundsFailed();
    }

    /// @dev Sells `amount` of `wearablesSubject`.
    /// Emits a {Trade} event.
    function sellWearables(bytes32 wearablesSubject, uint256 amount) external payable {
        {
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

    /// @dev Sells `amount` of `wearablesSubject` with a signature.
    /// Emits a {NonceUpdated} {Trade} event.
    function sellPrivateWearables(bytes32 wearablesSubject, uint256 amount, bytes calldata signature)
        external
        payable
    {
        {
            // Check if amount is greater than base unit
            if (amount < BASE_WEARABLE_UNIT) revert InsufficientBaseUnit();

            // Check if amount is a multiple of the base unit
            if (amount % BASE_WEARABLE_UNIT != 0) revert AmountNotMultipleOfBaseUnit();

            // Check if wearable exists
            if (wearables[wearablesSubject].creator == address(0)) revert WearableNotCreated();

            // Check if sale state is public
            if (wearables[wearablesSubject].state != SaleStates.PRIVATE) revert InvalidSaleState();

            uint256 nonce = nonces[msg.sender];
            // Validate signature
            bytes32 hashVal = keccak256(abi.encodePacked(msg.sender, "sell", wearablesSubject, amount, nonce));
            if (ECDSA.recover(hashVal, signature) != wearableSigner) {
                revert InvalidSignature();
            }
            // bytes32 signedHash = hashVal.toEthSignedMessageHash();
            // if (signedHash.recover(signature) != wearableSigner) {
            //     revert InvalidSignature();
            // }

            nonces[msg.sender] += 1;

            emit NonceUpdated(msg.sender, nonces[msg.sender]);
        }

        _sellWearables(wearablesSubject, amount, false);
    }

    /// @dev Internal sells `amount` of `wearablesSubject`.
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
        uint256 protocolFee = _getProtocolFee(price);

        // Get creator fee
        uint256 creatorFee = _getCreatorFee(price);

        // Check if user has enough amount for sale
        if (wearablesBalance[wearablesSubject][msg.sender] < amount) {
            revert InsufficientHoldings();
        }

        // Update wearables balance and supply
        wearablesBalance[wearablesSubject][msg.sender] = wearablesBalance[wearablesSubject][msg.sender] - amount;
        wearablesSupply[wearablesSubject] = supply - amount;

        // Get creator fee destination
        address creatorFeeDestination = wearables[wearablesSubject].creator;

        emit Trade(
            msg.sender, wearablesSubject, false, isPublic, amount, price, protocolFee, creatorFee, supply - amount
        );

        // Send sell funds to seller
        (bool success1,) = msg.sender.call{value: price - protocolFee - creatorFee}("");

        // Send protocol fee to protocol fee destination
        (bool success2,) = protocolFeeDestination.call{value: protocolFee}("");

        // Send creator fee to creator fee destination
        (bool success3,) = creatorFeeDestination.call{value: creatorFee}("");

        // Check if all funds were sent successfully
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
}