import { useMemo } from 'react';
import { Header } from '@/components/dashboard/Header';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { LiveMonitor } from '@/components/dashboard/LiveMonitor';
import { EventsTable } from '@/components/dashboard/EventsTable';
import { DriversTable } from '@/components/dashboard/DriversTable';
import { DurationChart } from '@/components/dashboard/DurationChart';
import { SeverityDistributionChart } from '@/components/dashboard/SeverityDistributionChart';
import { EventsTimelineChart } from '@/components/dashboard/EventsTimelineChart';
import { DriverPerformanceRadar } from '@/components/dashboard/DriverPerformanceRadar';
import { HourlyActivityHeatmap } from '@/components/dashboard/HourlyActivityHeatmap';
import { mockEvents, getDriversWithStatus } from '@/data/mockData';
import { Users, AlertTriangle, Clock, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const driversWithStatus = useMemo(() => getDriversWithStatus(), []);

  const metrics = useMemo(() => {
    const totalEvents = mockEvents.length;
    const highSeverityEvents = mockEvents.filter(e => e.severity === 'high').length;
    const totalDuration = mockEvents.reduce((acc, e) => acc + (e.duration || 0), 0);
    const avgDuration = Math.round(totalDuration / totalEvents);
    const activeDrivers = driversWithStatus.filter(d => d.currentStatus !== 'offline').length;

    return { totalEvents, highSeverityEvents, avgDuration, activeDrivers };
  }, [driversWithStatus]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Active Drivers"
            value={metrics.activeDrivers}
            subtitle={`of ${driversWithStatus.length} total`}
            icon={Users}
            variant="success"
          />
          <MetricCard
            title="Total Events"
            value={metrics.totalEvents}
            subtitle="Last 24 hours"
            icon={Activity}
            trend={{ value: 12, isPositive: false }}
          />
          <MetricCard
            title="High Severity"
            value={metrics.highSeverityEvents}
            subtitle="Requires attention"
            icon={AlertTriangle}
            variant="danger"
          />
          <MetricCard
            title="Avg Duration"
            value={`${metrics.avgDuration}s`}
            subtitle="Per event"
            icon={Clock}
            variant="warning"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <DurationChart events={mockEvents} />
          </div>
          <div>
            <LiveMonitor drivers={driversWithStatus} />
          </div>
        </div>

        {/* Charts Section - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="lg:col-span-2">
            <EventsTimelineChart events={mockEvents} />
          </div>
          <div>
            <SeverityDistributionChart events={mockEvents} />
          </div>
          <div>
            <HourlyActivityHeatmap events={mockEvents} />
          </div>
        </div>

        {/* Driver Performance Section */}
        <div className="mb-8">
          <DriverPerformanceRadar drivers={driversWithStatus} />
        </div>

        {/* Tabbed Tables */}
        <Tabs defaultValue="events" className="space-y-4">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="events" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Drowsiness Events
            </TabsTrigger>
            <TabsTrigger value="drivers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Driver Registry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="animate-fade-in">
            <EventsTable events={mockEvents} />
          </TabsContent>

          <TabsContent value="drivers" className="animate-fade-in">
            <DriversTable drivers={driversWithStatus} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Driver Safety Monitor • Intelligent Drowsiness Detection System</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
