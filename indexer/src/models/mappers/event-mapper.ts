import { EventAttributes } from '@/models/event';
import { TransactionCreationAttributes } from '@/models/transaction';

// Map event data to event attributes for database storage
export const mapToEventModel = (
  eventsData: any,
  transactionAttributes: TransactionCreationAttributes,
): EventAttributes[] => {
  const events = eventsData.map((eventData: any) => {
    return {
      chainId: transactionAttributes.chainId,
      module: eventData.module.namespace
        ? `${eventData.module.namespace}.${eventData.module.name}`
        : eventData.module.name,
      name: eventData.name,
      params: eventData.params,
      qualname: eventData.module.namespace
        ? `${eventData.module.namespace}.${eventData.module.name}`
        : eventData.module.name,
      requestkey: transactionAttributes.requestkey,
      orderIndex: eventData.orderIndex,
      creationtime: transactionAttributes.creationtime,
    } as EventAttributes;
  }) as EventAttributes[];

  return events;
};
