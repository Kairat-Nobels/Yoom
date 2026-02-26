'use client';

import { Call, CallRecording } from '@stream-io/video-react-sdk';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Loader from './Loader';
import { useGetCalls } from '@/hooks/useGetCalls';
import MeetingCard from './MeetingCard';

const CallList = ({ type }: { type: 'ended' | 'upcoming' | 'recordings' }) => {
  const router = useRouter();
  const { endedCalls, upcomingCalls, callRecordings, isLoading } = useGetCalls();
  const [recordings, setRecordings] = useState<CallRecording[]>([]);

  const formatDate = (value?: Date | string | null) => {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);

    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCalls = () => {
    switch (type) {
      case 'ended':
        return endedCalls;
      case 'recordings':
        return recordings;
      case 'upcoming':
        return upcomingCalls;
      default:
        return [];
    }
  };

  const getNoCallsMessage = () => {
    switch (type) {
      case 'ended':
        return 'Нет прошедших встреч';
      case 'upcoming':
        return 'Нет предстоящих встреч';
      case 'recordings':
        return 'Нет записей';
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchRecordings = async () => {
      const callData = await Promise.all(
        callRecordings?.map((meeting) => meeting.queryRecordings()) ?? []
      );

      const recs = callData
        .filter((call) => call.recordings.length > 0)
        .flatMap((call) => call.recordings);

      setRecordings(recs);
    };

    if (type === 'recordings') fetchRecordings();
  }, [type, callRecordings]);

  if (isLoading) return <Loader />;

  const calls = getCalls();
  const noCallsMessage = getNoCallsMessage();

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {calls && calls.length > 0 ? (
        calls.map((meeting: Call | CallRecording) => {
          const isRecording = type === 'recordings';

          const title =
            (meeting as Call).state?.custom?.description ||
            (meeting as CallRecording).filename?.substring(0, 20) ||
            'Без описания';

          const date =
            formatDate((meeting as Call).state?.startsAt as any) ||
            formatDate((meeting as CallRecording).start_time as any);

          const link = isRecording
            ? (meeting as CallRecording).url
            : `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${(meeting as Call).id}`;

          return (
            <MeetingCard
              key={(meeting as Call).id}
              icon={
                type === 'ended'
                  ? '/icons/previous.svg'
                  : type === 'upcoming'
                    ? '/icons/upcoming.svg'
                    : '/icons/recordings.svg'
              }
              title={title}
              date={date}
              isPreviousMeeting={type === 'ended'}
              link={link}
              buttonIcon1={isRecording ? '/icons/play.svg' : undefined}
              buttonText={isRecording ? 'Воспроизвести' : 'Начать'}
              handleClick={
                isRecording
                  ? () => router.push(String((meeting as CallRecording).url))
                  : () => router.push(`/meeting/${(meeting as Call).id}`)
              }
            />
          );
        })
      ) : (
        <h1 className="text-2xl font-bold text-white">{noCallsMessage}</h1>
      )}
    </div>
  );
};

export default CallList;
