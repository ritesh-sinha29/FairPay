// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FairPayStableEscrow
 * @notice Testnet MVP: a single-job escrow with client verification and atomic payment.
 * @dev Deploy a separate instance for each job; freelancer acceptance occurs offchain.
 * The deployer is the client and receives the client role. Do not deploy through a
 * factory or relayer, because the factory or relayer becomes the client.
 * There is NO refund, cancel, dispute or timeout path. If the client never funds,
 * the freelancer never submits, or the client never verifies, funds stay in the
 * state they are in (unfunded funds remain with the client).
 * The token is expected to be standard 6-decimal USDC. The Arc Testnet ERC-20
 * interface is 0x3600000000000000000000000000000000000000 (6 decimals).
 * Native gas uses 18 decimals and is never used by this contract. The token
 * address is supplied at construction, not hardcoded or checked against that address.
 * Amounts are raw token units. There is no owner, platform fee or privileged recovery.
 */
contract FairPayStableEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        AwaitingFunding,
        Funded,
        Submitted,
        Paid
    }

    error NotClient();
    error NotFreelancer();
    error WrongStatus(Status current, Status required);
    error InvalidFreelancer();
    error IdenticalParticipants();
    error InvalidToken();
    error InvalidAmount();
    error InvalidTitleLength(uint256 length);
    error InvalidAgreementHash();
    error InsufficientAllowance(uint256 allowance, uint256 required);
    error FeeOnTransferNotSupported(uint256 expected, uint256 received);
    error PayoutMismatch(uint256 expected, uint256 actual);

    event Funded(address indexed client, uint256 amount);
    event WorkSubmitted(address indexed freelancer);
    event PaymentReleased(address indexed freelancer, uint256 amount);

    /// @notice The only account authorized to fund and verify this job.
    address public immutable client;
    /// @notice The assigned worker and sole payout recipient.
    address public immutable freelancer;
    /// @notice The ERC-20 used for funding and payout.
    IERC20 public immutable token;
    /// @notice The fixed job price in raw token units.
    uint256 public immutable amount;
    /// @notice The job title, fixed at construction (1 through 160 bytes).
    string public title;
    /// @notice Commitment to the offchain agreement, fixed at construction.
    bytes32 public immutable agreementHash;
    /// @notice The current stage of this single-job escrow.
    Status public status;

    /**
     * @notice Commits the parties, payment terms and offchain agreement for one job.
     * @dev The deployer becomes the client. No funds are pulled. Do not deploy through
     * a factory or relayer, because that account receives the client role.
     * @param jobTitle Job title containing between 1 and 160 bytes inclusive.
     * @param jobFreelancer Assigned freelancer, distinct from the deployer.
     * @param paymentToken Nonzero ERC-20 address; expected to be USDC.
     * @param paymentAmount Positive price in raw token units (1 USDC = 1,000,000 units).
     * @param termsHash Nonzero commitment to the accepted offchain scope.
     */
    constructor(string memory jobTitle, address jobFreelancer, IERC20 paymentToken, uint256 paymentAmount, bytes32 termsHash) {
        if (jobFreelancer == address(0)) revert InvalidFreelancer();
        if (msg.sender == jobFreelancer) revert IdenticalParticipants();
        if (address(paymentToken) == address(0)) revert InvalidToken();
        if (paymentAmount == 0) revert InvalidAmount();
        uint256 titleLength = bytes(jobTitle).length;
        if (titleLength == 0 || titleLength > 160) revert InvalidTitleLength(titleLength);
        if (termsHash == bytes32(0)) revert InvalidAgreementHash();

        client = msg.sender;
        freelancer = jobFreelancer;
        token = paymentToken;
        amount = paymentAmount;
        title = jobTitle;
        agreementHash = termsHash;
        status = Status.AwaitingFunding;
    }

    /**
     * @notice Locks the agreed price from the client after a separate token approval.
     * @dev Only the client, only once. Requires receipt of exactly the agreed amount;
     * any transfer or balance-check failure rolls back the state and token transfer.
     * A balance moving in the wrong direction is reported as zero received.
     */
    function fund() external nonReentrant {
        if (msg.sender != client) revert NotClient();
        if (status != Status.AwaitingFunding) revert WrongStatus(status, Status.AwaitingFunding);

        uint256 allowance = token.allowance(client, address(this));
        if (allowance < amount) revert InsufficientAllowance(allowance, amount);
        uint256 balanceBefore = token.balanceOf(address(this));

        status = Status.Funded;
        token.safeTransferFrom(client, address(this), amount);

        uint256 balanceAfter = token.balanceOf(address(this));
        if (balanceAfter < balanceBefore) revert FeeOnTransferNotSupported(amount, 0);
        uint256 received = balanceAfter - balanceBefore;
        if (received != amount) revert FeeOnTransferNotSupported(amount, received);

        emit Funded(client, amount);
    }

    /**
     * @notice Marks the freelancer's offchain delivery as ready for client verification.
     * @dev Only the assigned freelancer may submit, and only after funding.
     * Submission neither pays nor creates a time-based release entitlement.
     */
    function markComplete() external {
        if (msg.sender != freelancer) revert NotFreelancer();
        if (status != Status.Funded) revert WrongStatus(status, Status.Funded);

        status = Status.Submitted;
        emit WorkSubmitted(freelancer);
    }

    /**
     * @notice Verifies delivery and pays the assigned freelancer in the same transaction.
     * @dev Only the client, only after submission, and at most once. State becomes Paid
     * before transfer; any failure rolls everything back to Submitted. Requires both
     * the escrow's debit and the freelancer's credit to equal exactly the price.
     * A balance moving in the wrong direction is reported as zero.
     * A recipient that the token refuses to pay (for example a blocklisted wallet)
     * makes this call revert every time; there is no alternate payout address.
     */
    function verifyAndRelease() external nonReentrant {
        if (msg.sender != client) revert NotClient();
        if (status != Status.Submitted) revert WrongStatus(status, Status.Submitted);

        status = Status.Paid;
        uint256 escrowBefore = token.balanceOf(address(this));
        uint256 freelancerBefore = token.balanceOf(freelancer);
        token.safeTransfer(freelancer, amount);

        uint256 escrowAfter = token.balanceOf(address(this));
        if (escrowAfter > escrowBefore) revert PayoutMismatch(amount, 0);
        uint256 debited = escrowBefore - escrowAfter;
        if (debited != amount) revert PayoutMismatch(amount, debited);

        uint256 freelancerAfter = token.balanceOf(freelancer);
        if (freelancerAfter < freelancerBefore) revert PayoutMismatch(amount, 0);
        uint256 credited = freelancerAfter - freelancerBefore;
        if (credited != amount) revert PayoutMismatch(amount, credited);

        emit PaymentReleased(freelancer, amount);
    }
}
