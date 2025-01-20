// PDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// import "hardhat/console.sol";

// https://github.com/ethereum-optimism/optimism/blob/08daf8dbd38c9ffdbd18fc9a211c227606cdb0ad/packages/contracts-bedrock/src/libraries/Types.sol#L62-L69
/// @title Types
/// @notice Contains various types used throughout the Optimism contract system.
library Types {
  /// @notice Struct representing a withdrawal transaction.
  /// @custom:field nonce    Nonce of the withdrawal transaction
  /// @custom:field sender   Address of the sender of the transaction.
  /// @custom:field target   Address of the recipient of the transaction.
  /// @custom:field value    Value to send to the recipient.
  /// @custom:field gasLimit Gas limit of the transaction.
  /// @custom:field data     Data of the transaction.
  struct WithdrawalTransaction {
    uint256 nonce;
    address sender;
    address target;
    uint256 value;
    uint256 gasLimit;
    bytes data;
  }
}

contract MyOpStackPortal {
  function finalizeWithdrawalTransactionExternalProof(
    Types.WithdrawalTransaction memory _tx,
    address
  ) external returns (bytes memory) {
    (bool sent, bytes memory data) = payable(_tx.target).call{value: _tx.value}(
      ""
    );
    if (!sent) {
      revert("Failed to send Ether");
    }
    return data;
  }

  receive() external payable {}
}
