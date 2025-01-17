import { EthereumAddress, ProjectId, UnixTime } from '@l2beat/shared'

import {
  CONTRACTS,
  DATA_AVAILABILITY,
  EXITS,
  FORCE_TRANSACTIONS,
  makeBridgeCompatible,
  MILESTONES,
  OPERATOR,
  RISK_VIEW,
} from './common'
import { ProjectDiscovery } from './common/ProjectDiscovery'
import { Layer2 } from './types'

const discovery = new ProjectDiscovery('nova')

export const nova: Layer2 = {
  type: 'layer2',
  id: ProjectId('nova'),
  display: {
    name: 'Arbitrum Nova',
    slug: 'nova',
    description:
      'Arbitrum Nova is an AnyTrust chain that aims for ultra low transaction fees. Nova differs from Arbitrum One by not posting transaction data on chain, but to Data Availability Committee.',
    purpose: 'Universal',
    links: {
      websites: ['https://arbitrum.io/', 'https://offchainlabs.com/'],
      apps: [],
      documentation: [
        'https://developer.offchainlabs.com/',
        'https://github.com/OffchainLabs/nitro/blob/master/docs/inside_anytrust.md',
      ],
      explorers: [
        'https://nova.arbiscan.io/',
        'https://a4ba-explorer.arbitrum.io/',
      ],
      repositories: ['https://github.com/OffchainLabs/nitro'],
      socialMedia: [
        'https://twitter.com/OffchainLabs',
        'https://twitter.com/arbitrum',
        'https://medium.com/offchainlabs',
        'https://discord.gg/5KE54JwyTs',
      ],
    },
    activityDataSource: 'Blockchain RPC',
  },
  config: {
    escrows: [
      {
        address: EthereumAddress('0xC1Ebd02f738644983b6C4B2d440b8e77DdE276Bd'),
        sinceTimestamp: new UnixTime(1656073623),
        tokens: ['ETH'],
      },
      {
        address: EthereumAddress('0xA2e996f0cb33575FA0E36e8f62fCd4a9b897aAd3'),
        sinceTimestamp: new UnixTime(1659620187),
        tokens: ['DAI'],
      },
      {
        address: EthereumAddress('0xB2535b988dcE19f9D71dfB22dB6da744aCac21bf'),
        sinceTimestamp: new UnixTime(1656305583),
        tokens: '*',
      },
    ],
    events: [],
    transactionApi: {
      type: 'rpc',
      url: 'https://nova.arbitrum.io/rpc',
      callsPerMinute: 200,
      // We need to subtract the Nitro system transaction in every block except for genesis
      assessCount: (count: number, blockNumber: number) =>
        blockNumber !== 0 ? count - 1 : count,
      startBlock: 1, // block 0 has timestamp of beginning of unix time
    },
  },
  riskView: makeBridgeCompatible({
    stateValidation: {
      value: 'Fraud proofs (INT)',
      description:
        'Fraud proofs allow WHITELISTED actors watching the chain to prove that the state is incorrect. Interactive proofs (INT) require multiple transactions over time to resolve.',
      sentiment: 'warning',
    },
    dataAvailability: RISK_VIEW.DATA_EXTERNAL_DAC,
    upgradeability: RISK_VIEW.UPGRADABLE_YES,
    sequencerFailure: RISK_VIEW.SEQUENCER_TRANSACT_L1,
    validatorFailure: {
      value: 'Propose blocks',
      description:
        'Anyone can become a Validator after 7-days of inactivity from the currently whitelisted Validators.',
    },
    destinationToken: RISK_VIEW.NATIVE_AND_CANONICAL(),
    validatedBy: RISK_VIEW.VALIDATED_BY_ETHEREUM,
  }),
  technology: {
    category: 'Optimistic Chain',
    stateCorrectness: {
      name: 'Fraud proofs ensure state correctness',
      description:
        'After some period of time, the published state root is assumed to be correct. For a certain time period, usually one week one of the whitelisted actors can submit a fraud proof that shows that the state was incorrect.',
      risks: [
        {
          category: 'Funds can be stolen if',
          text: 'none of the whitelisted verifiers checks the published state. Fraud proofs assume at least one honest and able validator.',
          isCritical: true,
        },
      ],
      references: [
        {
          text: 'How is fraud proven - Arbitrum documentation FAQ',
          href: 'https://developer.offchainlabs.com/intro/#q-and-how-exactly-is-fraud-proven-sounds-complicated',
        },
        {
          text: 'RollupUser.sol#L288 - Etherscan source code, onlyValidator modifier',
          href: 'https://etherscan.io/address/0xA0Ed0562629D45B88A34a342f20dEb58c46C15ff#code#F61#L288',
        },
      ],
    },
    dataAvailability: DATA_AVAILABILITY.ANYTRUST_OFF_CHAIN,
    operator: {
      ...OPERATOR.CENTRALIZED_SEQUENCER,
      references: [
        {
          text: 'Sequencer - Arbitrum documentation',
          href: 'https://developer.offchainlabs.com/sequencer',
        },
      ],
    },
    forceTransactions: {
      ...FORCE_TRANSACTIONS.CANONICAL_ORDERING,
      references: [
        {
          text: 'Sequencer Isn’t Doing Its Job - Arbitrum documentation',
          href: 'https://developer.offchainlabs.com/sequencer#unhappyuncommon-case-sequencer-isnt-doing-its-job',
        },
      ],
    },
    exitMechanisms: [
      {
        ...EXITS.REGULAR('optimistic', 'merkle proof'),
        references: [
          {
            text: 'Transaction lifecycle - Arbitrum documentation',
            href: 'https://developer.offchainlabs.com/tx-lifecycle',
          },
          {
            text: 'L2 to L1 Messages - Arbitrum documentation',
            href: 'https://developer.offchainlabs.com/arbos/l2-to-l1-messaging',
          },
          {
            text: 'Mainnet for everyone - Arbitrum Blog',
            href: 'https://offchain.medium.com/mainnet-for-everyone-27ce0f67c85e',
          },
        ],
        risks: [],
      },
      {
        name: 'Tradeable Bridge Exit',
        description:
          "When a user initiates a regular withdrawal a third party verifying the chain can offer to buy this withdrawal by paying the user on L1. The user will get the funds immediately, however the third party has to wait for the block to be finalized. This is implemented as a first party functionality inside Arbitrum's token bridge.",
        risks: [],
        references: [
          {
            text: 'Tradeable Bridge Exits - Arbitrum documentation',
            href: 'https://developer.offchainlabs.com/docs/withdrawals#tradeable-bridge-exits',
          },
        ],
      },
    ],
    smartContracts: {
      name: 'EVM compatible smart contracts are supported',
      description:
        'Arbitrum Nova uses Nitro technology that allows running fraud proofs by executing EVM code on top of WASM.',
      risks: [
        {
          category: 'Funds can be lost if',
          text: 'there are mistakes in the highly complex Nitro and WASM one-step prover implementation.',
        },
      ],
      references: [
        {
          text: 'Arbitrum Nitro Sneak Preview',
          href: 'https://medium.com/offchainlabs/arbitrum-nitro-sneak-preview-44550d9054f5',
        },
      ],
    },
  },
  contracts: {
    addresses: [
      {
        name: 'ProxyAdmin',
        address: discovery.getContract('ProxyAdmin').address,
        description:
          'This contract is an admin of most other contracts allowed to upgrade their implementations. It is owned by a 4-of-6 multisig.',
      },
      {
        address: discovery.getContract('ArbitrumProxy').address,
        name: 'Rollup',
        description:
          'Main contract implementing Arbitrum Nova Rollup. Manages other Rollup components, list of Stakers and Validators. Entry point for Validators creating new Rollup Nodes (state commits) and Challengers submitting fraud proofs.',
        upgradeability: discovery.getContract('ArbitrumProxy').upgradeability,
      },
      {
        address: discovery.getContract('SequencerInbox').address,
        name: 'SequencerInbox',
        description:
          'Main entry point for the Sequencer submitting transaction batches to a Rollup.',
        upgradeability: discovery.getContract('SequencerInbox').upgradeability,
      },
      {
        address: discovery.getContract('Inbox').address,
        name: 'Inbox',
        description:
          'Entry point for users depositing ETH and sending L1 --> L2 messages. Deposited ETH is escowed in a Bridge contract.',
        upgradeability: discovery.getContract('Inbox').upgradeability,
      },
      {
        address: discovery.getContract('Bridge').address,
        name: 'Bridge',
        description:
          'Contract managing Inboxes and Outboxes. It escrows ETH sent to L2.',
        upgradeability: discovery.getContract('Bridge').upgradeability,
      },
      {
        address: discovery.getContract('Outbox').address,
        name: 'Outbox',
        upgradeability: discovery.getContract('Outbox').upgradeability,
      },
      {
        address: discovery.getContract('ChallengeManager').address,
        name: 'ChallengeManager',
        description:
          'Contract managing an interactive fraud challenge process.',
        upgradeability:
          discovery.getContract('ChallengeManager').upgradeability,
      },
      {
        address: discovery.getContract('OneStepProofEntry').address,
        name: 'OneStepProofEntry',
        description:
          'Contract managing adjudication logic for EVM implementation in WASM used by the fraud proofs.',
      },
      {
        address: EthereumAddress('0xa8f7DdEd54a726eB873E98bFF2C95ABF2d03e560'),
        name: 'ProxyAdmin (2)',
        description:
          'This is a different proxy admin for the three gateway contracts below. It is also owned by a 4-of-6 multisig.',
      },
      {
        address: EthereumAddress('0xC840838Bc438d73C16c2f8b22D2Ce3669963cD48'),
        name: 'L1GatewayRouter',
        description: 'Router managing token <--> gateway mapping.',
        upgradeability: {
          type: 'EIP1967 proxy',
          admin: EthereumAddress('0xa8f7DdEd54a726eB873E98bFF2C95ABF2d03e560'),
          implementation: EthereumAddress(
            '0x52595021fA01B3E14EC6C88953AFc8E35dFf423c',
          ),
        },
      },
      {
        address: EthereumAddress('0xB2535b988dcE19f9D71dfB22dB6da744aCac21bf'),
        name: 'L1ERC20Gateway',
        description:
          'Main entry point for users depositing ERC20 tokens. Upon depositing, on L2 a generic, "wrapped" token will be minted.',
        upgradeability: {
          type: 'EIP1967 proxy',
          admin: EthereumAddress('0xa8f7DdEd54a726eB873E98bFF2C95ABF2d03e560'),
          implementation: EthereumAddress(
            '0xb4299A1F5f26fF6a98B7BA35572290C359fde900',
          ),
        },
      },
      {
        address: EthereumAddress('0x23122da8C581AA7E0d07A36Ff1f16F799650232f'),
        name: 'L1CustomGateway',
        description:
          'Main entry point for users depositing ERC20 tokens that require minting custom token on L2.',
        upgradeability: {
          type: 'EIP1967 proxy',
          admin: EthereumAddress('0xa8f7DdEd54a726eB873E98bFF2C95ABF2d03e560'),
          implementation: EthereumAddress(
            '0xC8D26aB9e132C79140b3376a0Ac7932E4680Aa45',
          ),
        },
      },
      {
        address: EthereumAddress('0x97f63339374fCe157Aa8Ee27830172d2AF76A786'),
        name: 'L1DaiGateway',
        description:
          'Custom DAI Gateway, main entry point for users depositing DAI to L2 where "canonical" L2 DAI token managed by MakerDAO will be minted. Managed by MakerDAO.',
      },
      {
        address: EthereumAddress('0xA2e996f0cb33575FA0E36e8f62fCd4a9b897aAd3'),
        name: 'L1Escrow',
        description: 'DAI Vault for custom DAI Gateway managed by MakerDAO.',
      },
    ],
    risks: [CONTRACTS.UPGRADE_NO_DELAY_RISK],
  },
  milestones: [
    {
      ...MILESTONES.MAINNET_OPEN,
      date: '2022-08-09T00:00:00Z',
      link: 'https://medium.com/offchainlabs/its-time-for-a-new-dawn-nova-is-open-to-the-public-a081df1e4ad2',
    },
  ],
}
