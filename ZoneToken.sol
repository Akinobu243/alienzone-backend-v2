// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/** 
 * @title ZoneToken
 * @dev ERC-20 token for the Alienzone ecosystem
 */
contract ZoneToken is ERC20, Ownable {
    
    // Maximum supply of ZONE tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    
    // Address that can mint tokens (initially the owner)
    address public minter;
    
    event MinterUpdated(address indexed previousMinter, address indexed newMinter);
    
    /**
     * @dev Constructor that sets the initial owner and mints initial supply
     * @param initialOwner The address that will own the contract
     * @param initialSupply The initial amount of tokens to mint to the owner
     */
    constructor(address initialOwner, uint256 initialSupply) 
        ERC20("ZONE", "ZONE") 
        Ownable(initialOwner)
    {
        require(initialSupply <= MAX_SUPPLY, "Initial supply exceeds max supply");
        _mint(initialOwner, initialSupply);
        minter = initialOwner;
    }
    
    /**
     * @dev Modifier to restrict function access to minter only
     */
    modifier onlyMinter() {
        require(msg.sender == minter, "Caller is not the minter");
        _;
    }
    
    /**
     * @dev Sets a new minter address
     * @param newMinter The new minter address
     */
    function setMinter(address newMinter) external onlyOwner {
        require(newMinter != address(0), "New minter cannot be zero address");
        address oldMinter = minter;
        minter = newMinter;
        emit MinterUpdated(oldMinter, newMinter);
    }
    
    /**
     * @dev Mints new tokens
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyMinter {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Burns tokens from the caller's account
     * @param amount The amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev Burns tokens from a specific account (requires allowance)
     * @param from The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) external {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
    }
    
    /**
     * @dev Returns the maximum supply of tokens
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
} 