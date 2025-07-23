import { Event, PageInfo } from '../../config/graphql-types';
import { PaginationsParams } from '../pagination';
import { ConnectionEdge } from '../types';

export interface GetBlockEventsParams extends PaginationsParams {
  hash: string;
}

export type GetTransactionEventsParams = GetTotalTransactionEventsCount & PaginationsParams;

export type GetEventsParams = GetTotalEventsCount & PaginationsParams;

export interface GetTotalEventsCount {
  qualifiedEventName: string;
  blockHash?: string | null;
  chainId?: string | null;
  minHeight?: number | null;
  maxHeight?: number | null;
  minimumDepth?: number | null;
  requestKey?: string | null;
}

export interface GetTotalTransactionEventsCount {
  transactionId: string;
}

export type EventOutput = Omit<Event, 'block' | 'totalCount'> & {
  eventId: string;
};

export interface GetEventParams {
  hash: string;
  orderIndex: number;
  requestKey: string;
}

export interface GetLastEventsParams {
  qualifiedEventName: string;
  quantity: number;
  lastEventId?: number;
  chainId?: string | null;
  minimumDepth?: number | null;
}

export default interface EventRepository {
  getEvent(params: GetEventParams): Promise<EventOutput>;
  getBlockEvents(params: GetBlockEventsParams): Promise<{
    pageInfo: PageInfo;
    edges: ConnectionEdge<EventOutput>[];
  }>;
  getTransactionEvents(params: GetTransactionEventsParams): Promise<{
    pageInfo: PageInfo;
    edges: ConnectionEdge<EventOutput>[];
  }>;
  getEventsWithQualifiedName(params: GetEventsParams): Promise<{
    pageInfo: PageInfo;
    edges: ConnectionEdge<EventOutput>[];
  }>;
  getTotalEventsCount(hash: GetTotalEventsCount): Promise<number>;
  getTotalTransactionEventsCount(hash: GetTotalTransactionEventsCount): Promise<number>;
  getTotalCountOfBlockEvents(hash: string): Promise<number>;
  getLastEventId(): Promise<number>;
  getLastEvents(params: GetLastEventsParams): Promise<EventOutput[]>;
}
