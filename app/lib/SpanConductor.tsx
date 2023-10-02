import React from 'react';
import { Event } from '@/app/payments/ReceivedStream';

export interface SpanConductorProps {
  event: Event
}

export const SpanConductorOne: React.FC<SpanConductorProps> = ({ event }) => {
  
  const formattedType = event.type.replace(/_/g, ' ');
  return (
    <span className="font-mono">
      Stream {formattedType}
    </span>
  );
}

export const SpanConductorTwo: React.FC<SpanConductorProps> = ({ event }) => {
  switch (event.type) {
    case 'stream_created':
      return (
        <span className="font-mono">
          {event.data.amount} APT streaming
        </span>
      );
  
    case 'stream_claimed':
      return (
        <span className="font-mono">
          APT claimed
        </span>
      );

    case 'stream_accepted':
      return (
        <span className="font-mono">
          No Data
        </span>
      );
    
    case 'stream_cancelled':
      return (
        <span className="font-mono">
          Stream canceled
        </span>
      );

      default:
        return <></>
  }
}





