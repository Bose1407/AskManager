import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Plus, Check, X, RefreshCw } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface LeaveRequest {
  _id: string;
  employee: {
    _id: string;
    name: string;
  };
  startDate: string;
  endDate: string;
  type: 'Sick' | 'Casual' | 'Annual' | 'Maternity' | 'Paternity';
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
  createdAt: string;
}

const leaveTypes = ['Sick', 'Casual', 'Annual', 'Maternity', 'Paternity'];

export default function DashboardLeaves() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveRequest['type']>('Annual');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('leave:created', (leave: LeaveRequest) => {
      setLeaves((prev) => [leave, ...prev]);
    });

    socket.on('leave:approved', (leave: LeaveRequest) => {
      setLeaves((prev) =>
        prev.map((l) =>
          l._id === leave._id ? { ...l, status: 'Approved' as const } : l
        )
      );
    });

    socket.on('leave:rejected', (leave: LeaveRequest) => {
      setLeaves((prev) =>
        prev.map((l) =>
          l._id === leave._id ? { ...l, status: 'Rejected' as const } : l
        )
      );
    });

    return () => {
      socket.off('leave:created');
      socket.off('leave:approved');
      socket.off('leave:rejected');
    };
  }, [socket]);

  const fetchLeaves = async () => {
    try {
      const response = await fetch('/api/leaves', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLeaves(data.leaves || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startD = new Date(start);
    const endD = new Date(end);
    const diffTime = Math.abs(endD.getTime() - startD.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleRequestLeave = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const daysRequested = calculateDays(startDate, endDate);
      
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          startDate,
          endDate,
          type: leaveType,
          reason,
          daysRequested,
        }),
      });

      if (response.ok) {
        setStartDate('');
        setEndDate('');
        setLeaveType('Annual');
        setReason('');
        setRequestModalOpen(false);
      } else {
        alert('Failed to request leave');
      }
    } catch (error) {
      console.error('Failed to request leave:', error);
      alert('Failed to request leave');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/leaves/${id}/approve`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!response.ok) {
        alert('Failed to approve leave');
      }
    } catch (error) {
      console.error('Failed to approve leave:', error);
      alert('Failed to approve leave');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/leaves/${id}/reject`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!response.ok) {
        alert('Failed to reject leave');
      }
    } catch (error) {
      console.error('Failed to reject leave:', error);
      alert('Failed to reject leave');
    }
  };

  const getStatusColor = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'Rejected':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      case 'Pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: LeaveRequest['type']) => {
    switch (type) {
      case 'Sick':
        return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300';
      case 'Casual':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case 'Annual':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
      case 'Maternity':
        return 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300';
      case 'Paternity':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-gray-900">
          <div className="text-center animate-scale-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary mb-4 animate-pulse-subtle shadow-2xl">
              <RefreshCw className="w-10 h-10 text-white animate-spin" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-semibold text-lg">Loading leaves...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending');
  const approvedLeaves = leaves.filter((l) => l.status === 'Approved');
  const rejectedLeaves = leaves.filter((l) => l.status === 'Rejected');
  const canApprove = user?.role === 'manager' || user?.role === 'admin';

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-gray-900 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl animate-pulse-subtle"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-400/15 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="flex items-center justify-between mb-8 animate-fade-in relative z-10">
          <h1 className="text-5xl font-bold text-gradient">Leave Management</h1>
          <Button
            onClick={() => setRequestModalOpen(true)}
            className="bg-gradient-primary hover:brightness-105 hover:ring-2 ring-teal-300/50 text-white font-semibold shadow-xl hover:shadow-2xl transition-all group px-6 py-5 btn-glow ripple"
          >
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Request Leave
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative z-10">
          <Card className="border-0 shadow-xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingLeaves.length}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedLeaves.length}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedLeaves.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests */}
        <Card className="border-0 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 card-hover relative z-10">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gradient">Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaves.map((leave) => (
                <div
                  key={leave._id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg gap-4 transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {leave.employee.name}
                      </h3>
                      <Badge className={getTypeColor(leave.type)}>
                        {leave.type}
                      </Badge>
                      <Badge className={getStatusColor(leave.status)}>
                        {leave.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {leave.reason}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(leave.startDate).toLocaleDateString()} -{' '}
                        {new Date(leave.endDate).toLocaleDateString()}
                      </span>
                      <span className="ml-2">
                        ({calculateDays(leave.startDate, leave.endDate)} days)
                      </span>
                    </div>
                  </div>

                  {leave.status === 'Pending' && canApprove && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(leave._id)}
                        size="sm"
                        className="bg-gradient-primary text-white hover:brightness-105 hover:ring-2 ring-teal-300/50"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(leave._id)}
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {leaves.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No leave requests yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Request Leave Modal */}
        <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Leave Type</Label>
                <Select value={leaveType} onValueChange={(value: any) => setLeaveType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for your leave request"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              {startDate && endDate && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Duration: {calculateDays(startDate, endDate)} days
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRequestModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRequestLeave}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
