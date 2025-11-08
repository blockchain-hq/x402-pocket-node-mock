/**
 * Pocket Node Mock - n8n Node
 * Mock server for HTTP 402 Payment Required using official x402 protocol
 */

import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

import { X402Server } from 'x402-server-sdk';

export class PocketNodeMock implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Pocket node Mock',
    name: 'PocketNodeMock',
    icon: 'file:pocket.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Mock server for HTTP 402 Payment Required (x402 protocol)',
    defaults: {
      name: 'Pocket Node Mock',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'pocketNodeApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Return 402',
            value: 'return402',
            description: 'Return HTTP 402 Payment Required response',
            action: 'Return 402 payment required',
          },
          {
            name: 'Verify Payment',
            value: 'verifyPayment',
            description: 'Verify a payment signature',
            action: 'Verify a payment signature',
          },
        ],
        default: 'return402',
      },

      // Return 402 fields
      {
        displayName: 'Resource URL',
        name: 'resource',
        type: 'string',
        default: '/api/resource',
        required: true,
        displayOptions: {
          show: {
            operation: ['return402'],
          },
        },
        description: 'URL of the resource requiring payment',
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: 'Premium content access',
        required: true,
        displayOptions: {
          show: {
            operation: ['return402'],
          },
        },
        description: 'Human-readable description of the resource',
      },
      {
        displayName: 'Amount (USDC)',
        name: 'amount',
        type: 'string',
        default: '0.01',
        required: true,
        displayOptions: {
          show: {
            operation: ['return402'],
          },
        },
        description: 'Amount required in USDC (e.g., 0.01 for 1 cent)',
      },
      {
        displayName: 'MIME Type',
        name: 'mimeType',
        type: 'string',
        default: 'application/json',
        displayOptions: {
          show: {
            operation: ['return402'],
          },
        },
        description: 'MIME type of the resource response',
      },
      {
        displayName: 'Timeout (seconds)',
        name: 'timeout',
        type: 'number',
        default: 60,
        displayOptions: {
          show: {
            operation: ['return402'],
          },
        },
        description: 'Maximum timeout in seconds',
      },

      // Verify Payment fields
      {
        displayName: 'Transaction Signature',
        name: 'signature',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['verifyPayment'],
          },
        },
        description: 'Solana transaction signature to verify',
        placeholder: '5VERv8NMvzbJMEkV...',
      },
      {
        displayName: 'Expected Amount (USDC)',
        name: 'expectedAmount',
        type: 'string',
        default: '0.01',
        required: true,
        displayOptions: {
          show: {
            operation: ['verifyPayment'],
          },
        },
        description: 'Expected payment amount in USDC',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    // Get credentials
    const credentials = await this.getCredentials('pocketNodeApi');
    const recipientAddress = credentials.walletAddress as string;
    const network = (credentials.network as 'devnet' | 'mainnet-beta') || 'devnet';

    // Initialize x402 server
    const server = new X402Server({
      recipientAddress,
      network,
    });

    for (let i = 0; i < items.length; i++) {
      try {
        if (operation === 'return402') {
          // Return 402 Payment Required response
          const resource = this.getNodeParameter('resource', i) as string;
          const description = this.getNodeParameter('description', i) as string;
          const amount = this.getNodeParameter('amount', i) as string;
          const mimeType = this.getNodeParameter('mimeType', i, 'application/json') as string;
          const timeout = this.getNodeParameter('timeout', i, 60) as number;

          const response = server.create402Response({
            resource,
            description,
            amount,
            mimeType,
            timeout,
          });

          returnData.push({
            json: {
              statusCode: 402,
              ...response,
            },
            pairedItem: { item: i },
          });

        } else if (operation === 'verifyPayment') {
          // Verify payment
          const signature = this.getNodeParameter('signature', i) as string;
          const expectedAmount = this.getNodeParameter('expectedAmount', i) as string;

          const verification = await server.verifyPayment(signature, expectedAmount);

          returnData.push({
            json: {
              verified: verification.valid,
              signature,
              amount: verification.amount,
              from: verification.from,
              to: verification.to,
              error: verification.error,
            },
            pairedItem: { item: i },
          });
        }

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
      }
    }

    return [returnData];
  }
}