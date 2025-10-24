import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Toast } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/toaster';
import { toast } from 'sonner';
import { Save, Eye, EyeOff, Lock } from 'lucide-react';

export default function DashboardSettings() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'manager',
    phone: '+1 (555) 123-4567',
    department: 'Management',
    bio: 'Experienced team manager with 5+ years in leadership',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    taskAssigned: true,
    taskCompleted: true,
    leaveApproval: true,
    chatMentions: true,
    dailySummary: false,
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = () => {
    if (!profileData.name || !profileData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    toast.success('Profile updated successfully!');
    setIsEditing(false);
  };

  const handlePasswordChange = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    toast.success('Password changed successfully!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Settings & Profile
        </h1>

        <div className="space-y-6 max-w-4xl">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage your personal profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo */}
              <div className="flex items-center gap-4">
                <img
                  src={user?.profilePhoto || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                  alt="Profile"
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    JPG, PNG or GIF (Max. 5MB)
                  </p>
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      name="department"
                      value={profileData.department}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={profileData.role} disabled={!isEditing}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleSaveProfile}
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Password Section */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    className="mt-1 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded text-sm">
                <p className="text-blue-700 dark:text-blue-300">
                  ✓ Password must be at least 6 characters long
                </p>
              </div>

              <Button
                onClick={handlePasswordChange}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Email Notifications
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive all notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={() => handleNotificationChange('emailNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Task Assigned
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified when tasks are assigned to you
                    </p>
                  </div>
                  <Switch
                    checked={notifications.taskAssigned}
                    onCheckedChange={() => handleNotificationChange('taskAssigned')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Task Completed
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified when tasks are completed
                    </p>
                  </div>
                  <Switch
                    checked={notifications.taskCompleted}
                    onCheckedChange={() => handleNotificationChange('taskCompleted')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Leave Approval
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified when leave requests are processed
                    </p>
                  </div>
                  <Switch
                    checked={notifications.leaveApproval}
                    onCheckedChange={() => handleNotificationChange('leaveApproval')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Chat Mentions
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified when mentioned in chat
                    </p>
                  </div>
                  <Switch
                    checked={notifications.chatMentions}
                    onCheckedChange={() => handleNotificationChange('chatMentions')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Daily Summary
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive a daily summary of activities
                    </p>
                  </div>
                  <Switch
                    checked={notifications.dailySummary}
                    onCheckedChange={() => handleNotificationChange('dailySummary')}
                  />
                </div>
              </div>

              <Button
                onClick={() => toast.success('Notification preferences saved!')}
                className="bg-green-600 hover:bg-green-700 w-full"
              >
                Save Preferences
              </Button>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-900">
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="destructive" disabled>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
