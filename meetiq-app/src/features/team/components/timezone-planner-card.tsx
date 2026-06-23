import { Globe, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface TimezoneInfo {
  uniqueTzList: {
    timezone: string;
    members: { user_id: string; profile?: { avatar_url?: string | null; display_name?: string | null } | null }[];
    localTime: string;
    offset: string;
  }[];
  userLocalHoursData: { hour: number; availableCount: number; percentage: number }[];
  optimalSlotText: string;
  currentUserTimezone: string;
}

interface TimezonePlannerCardProps {
  insights: TimezoneInfo;
  activeMembersCount: number;
}

export function TimezonePlannerCard({ insights, activeMembersCount }: TimezonePlannerCardProps) {
  return (
    <Card className="border border-slate-200 shadow-meetiq-xs overflow-hidden">
      <CardContent className="p-6 space-y-6 bg-white">
        <div className="flex items-start justify-between border-b pb-4 border-slate-100">
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-lg text-primary flex items-center gap-2">
              <Globe className="h-5 w-5 text-accent" />
              Timezone & Meeting Planner
            </h3>
            <p className="text-xs text-muted-foreground font-body">
              Find optimal hours for team meetings and see represented timezones. Working hours are set to 9:00 AM - 5:00 PM local time.
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-50 text-accent font-semibold text-xs border border-blue-200 shrink-0">
            <Sparkles className="h-3.5 w-3.5 mr-1 text-accent animate-pulse" />
            Best Slot: {insights.optimalSlotText.split(' (')[0]}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block font-heading">
                24-Hour Working Overlap (Your Local Time)
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {insights.currentUserTimezone}
              </span>
            </div>

            <div
              className="bg-slate-50 p-3 rounded-lg border border-slate-200/50"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0, 1fr))', gap: '4px' }}
            >
              {insights.userLocalHoursData.map((h) => (
                <div key={h.hour} className="group relative flex flex-col items-center">
                  <div
                    className={`w-full rounded-sm transition-colors duration-200 ${
                      h.percentage === 100
                        ? 'bg-accent'
                        : h.percentage >= 75
                        ? 'bg-accent/80'
                        : h.percentage >= 50
                        ? 'bg-accent/60'
                        : h.percentage >= 25
                        ? 'bg-accent/40'
                        : h.availableCount > 0
                        ? 'bg-accent/20'
                        : 'bg-slate-200'
                    }`}
                    style={{ height: '36px' }}
                  />
                  {h.hour % 4 === 0 && (
                    <span className="text-[9px] text-muted-foreground font-mono mt-1.5 select-none">
                      {h.hour === 0 ? '12a' : h.hour === 12 ? '12p' : h.hour > 12 ? `${h.hour-12}p` : `${h.hour}a`}
                    </span>
                  )}
                  <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-10 transition-all pointer-events-none">
                    <div className="bg-slate-900 text-white text-[10px] p-2 rounded-md shadow-lg whitespace-nowrap text-center font-mono">
                      {h.hour === 0 ? '12:00 AM' : h.hour === 12 ? '12:00 PM' : h.hour > 12 ? `${h.hour-12}:00 PM` : `${h.hour}:00 AM`}
                      <div className="font-semibold text-accent mt-0.5">
                        {h.availableCount} of {activeMembersCount} available
                      </div>
                    </div>
                    <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.75" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-muted-foreground font-body">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-accent" />
                <span>100% Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-accent/60" />
                <span>50% Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-accent/20" />
                <span>&gt;0% Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
                <span>0% Available</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block border-b pb-1.5 border-slate-100 font-heading">
              Represented Timezones
            </span>

            <div className="max-h-[140px] overflow-y-auto divide-y divide-slate-100 pr-1 space-y-2">
              {insights.uniqueTzList.map(({ timezone, members: tzMembers, localTime, offset }) => (
                <div key={timezone} className="flex items-center justify-between py-1.5 text-xs first:pt-0">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 truncate max-w-[120px] sm:max-w-none">
                        {timezone.split('/').pop()?.replace('_', ' ')}
                      </span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 bg-slate-50 text-slate-400 font-normal border-slate-100">
                        {offset}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-body block font-mono">
                      Current Time: {localTime}
                    </span>
                  </div>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {tzMembers.map((m) => (
                      <Avatar key={m.user_id} className="h-6 w-6 ring-2 ring-white">
                        <AvatarImage src={m.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-[8px] bg-slate-100 font-bold text-slate-700">
                          {m.profile?.display_name ? getInitials(m.profile.display_name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
