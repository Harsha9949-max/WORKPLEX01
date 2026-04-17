import React from 'react';
import Countdown from 'react-countdown';

interface Props {
  deadline: any;
  onComplete?: () => void;
}

export default function CountdownTimer({ deadline, onComplete }: Props) {
  const renderer = ({ hours, minutes, seconds, completed }: any) => {
    if (completed) {
      return <span className="text-red-500 font-bold">Expired</span>;
    }
    return (
      <span className="font-mono font-bold tracking-widest">
        {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    );
  };

  return (
    <Countdown 
      date={deadline.toDate()} 
      renderer={renderer} 
      onComplete={onComplete}
    />
  );
}
