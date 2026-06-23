import { useMemo } from 'react';

interface Member {
  user_id: string;
  role: string;
  status?: string | null;
  joined_at: string;
  profile?: {
    id?: string;
    display_name?: string | null;
    avatar_url?: string | null;
    timezone?: string | null;
  } | null;
}

interface TimezoneInfo {
  uniqueTzList: {
    timezone: string;
    members: Member[];
    localTime: string;
    offset: string;
  }[];
  userLocalHoursData: { hour: number; availableCount: number; percentage: number }[];
  optimalSlotText: string;
  currentUserTimezone: string;
}

export function useTimezoneInsights(activeMembers: Member[], currentUserId?: string): TimezoneInfo | null {
  return useMemo(() => {
    if (!activeMembers || activeMembers.length === 0) return null;

    const currentUserTimezone = activeMembers.find(m => m.user_id === currentUserId)?.profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // 1. Group active members by timezone
    const tzMap: Record<string, Member[]> = {};
    activeMembers.forEach(m => {
      const tz = m.profile?.timezone || 'UTC';
      if (!tzMap[tz]) tzMap[tz] = [];
      tzMap[tz].push(m);
    });

    const uniqueTzList = Object.entries(tzMap).map(([tz, tzMembers]) => {
      let localTimeStr = '';
      let offsetStr = '';
      try {
        const now = new Date();
        localTimeStr = now.toLocaleTimeString('en-US', {
          timeZone: tz,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        const utcDate = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' });
        const parts = formatter.formatToParts(utcDate);
        const tzOffsetName = parts.find(p => p.type === 'timeZoneName')?.value || '';

        const userFormatter = new Intl.DateTimeFormat('en-US', { timeZone: currentUserTimezone, timeZoneName: 'longOffset' });
        const userParts = userFormatter.formatToParts(utcDate);
        const userOffsetName = userParts.find(p => p.type === 'timeZoneName')?.value || '';

        const parseOffset = (name: string) => {
          if (name === 'GMT' || !name.includes('GMT')) return 0;
          const sign = name.includes('-') ? -1 : 1;
          const timePart = name.replace(/GMT[+-]/, '');
          const [h, m] = timePart.split(':').map(Number);
          return sign * (h + (m || 0) / 60);
        };

        const offsetDiff = parseOffset(tzOffsetName) - parseOffset(userOffsetName);
        offsetStr = offsetDiff === 0 ? 'Same time' : offsetDiff > 0 ? `+${offsetDiff}h` : `${offsetDiff}h`;
      } catch {
        localTimeStr = 'Unknown';
        offsetStr = '';
      }

      return {
        timezone: tz,
        members: tzMembers,
        localTime: localTimeStr,
        offset: offsetStr
      };
    });

    // 2. Overlap timeline in current user's local timezone hours (0..23)
    const userLocalHoursData = new Array(24).fill(0).map((_, i) => ({
      hour: i,
      availableCount: 0,
      percentage: 0
    }));

    for (let userHour = 0; userHour < 24; userHour++) {
      try {
        activeMembers.forEach(member => {
          const mTimezone = member.profile?.timezone || 'UTC';
          try {
            const utcDate = new Date();
            const parseOffset = (name: string) => {
              if (name === 'GMT' || !name.includes('GMT')) return 0;
              const sign = name.includes('-') ? -1 : 1;
              const timePart = name.replace(/GMT[+-]/, '');
              const [h, m] = timePart.split(':').map(Number);
              return sign * (h + (m || 0) / 60);
            };
            const mOffset = parseOffset(new Intl.DateTimeFormat('en-US', { timeZone: mTimezone, timeZoneName: 'longOffset' }).formatToParts(utcDate).find(p => p.type === 'timeZoneName')?.value || '');
            const uOffset = parseOffset(new Intl.DateTimeFormat('en-US', { timeZone: currentUserTimezone, timeZoneName: 'longOffset' }).formatToParts(utcDate).find(p => p.type === 'timeZoneName')?.value || '');

            const localHour = (userHour + Math.round(mOffset - uOffset) + 24) % 24;
            if (localHour >= 9 && localHour < 17) {
              userLocalHoursData[userHour].availableCount++;
            }
          } catch {
            if (userHour >= 9 && userHour < 17) {
              userLocalHoursData[userHour].availableCount++;
            }
          }
        });

        userLocalHoursData[userHour].percentage = Math.round((userLocalHoursData[userHour].availableCount / activeMembers.length) * 100);
      } catch {
        // skip failed hour
      }
    }

    // 3. Find optimal meeting slots
    const maxAvailability = Math.max(...userLocalHoursData.map(h => h.availableCount));
    const optimalHours = userLocalHoursData.filter(h => h.availableCount === maxAvailability && maxAvailability > 0);

    let optimalSlotText = 'No overlap slots found';
    if (optimalHours.length > 0) {
      const ranges: string[] = [];
      let start = optimalHours[0].hour;
      let prev = start;

      const formatHourStr = (h: number) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        return `${displayHour} ${ampm}`;
      };

      for (let i = 1; i <= optimalHours.length; i++) {
        const curr = optimalHours[i]?.hour;
        if (curr !== prev + 1 || i === optimalHours.length) {
          const endHour = (prev + 1) % 24;
          ranges.push(`${formatHourStr(start)} - ${formatHourStr(endHour)}`);
          if (curr !== undefined) {
            start = curr;
            prev = curr;
          }
        } else {
          prev = curr;
        }
      }
      optimalSlotText = `${ranges.join(', ')} (${maxAvailability} of ${activeMembers.length} available)`;
    }

    return {
      uniqueTzList,
      userLocalHoursData,
      optimalSlotText,
      currentUserTimezone
    };
  }, [activeMembers, currentUserId]);
}
