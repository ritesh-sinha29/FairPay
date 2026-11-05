// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice Testnet MVP. Client approval is required, with no timeout or arbitration.
contract FairPayEscrow {
    enum Status { Funded, Submitted, Paid }

    address public immutable client;
    address payable public immutable freelancer;
    uint256 public immutable amount;
    string public title;
    Status public status;

    event WorkSubmitted(address indexed freelancer);
    event PaymentReleased(address indexed freelancer, uint256 amount);

    constructor(string memory jobTitle, address payable jobFreelancer) payable {
        require(bytes(jobTitle).length > 0 && bytes(jobTitle).length <= 160, "Invalid title");
        require(jobFreelancer != address(0) && jobFreelancer != msg.sender, "Invalid freelancer");
        require(msg.value > 0, "Deposit required");
        client = msg.sender;
        freelancer = jobFreelancer;
        amount = msg.value;
        title = jobTitle;
    }

    function markComplete() external {
        require(msg.sender == freelancer, "Only freelancer");
        require(status == Status.Funded, "Job already submitted");
        status = Status.Submitted;
        emit WorkSubmitted(msg.sender);
    }

    function releasePayment() external {
        require(msg.sender == client, "Only client");
        require(status == Status.Submitted, "Work must be submitted");
        status = Status.Paid;
        (bool success, ) = freelancer.call{value: amount}("");
        require(success, "Payment failed");
        emit PaymentReleased(freelancer, amount);
    }
}
