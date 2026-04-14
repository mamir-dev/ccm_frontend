import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Users, Shield, Building, Filter, Settings as SettingsIcon } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'care_teams', label: 'Care Teams', icon: Building },
    { id: 'insurances', label: 'Insurances', icon: Shield },
  ];

  // Fetch Users
  const { data: users, isLoading: loadingUsers } = useQuery('settings-users', async () => {
    const response = await api.get('/config/users');
    return response.data;
  }, { enabled: activeTab === 'users' });

  // Fetch Care Teams
  const { data: careTeams, isLoading: loadingTeams } = useQuery('settings-teams', async () => {
    const response = await api.get('/config/care-teams');
    return response.data;
  }, { enabled: activeTab === 'care_teams' });

  // Fetch Insurances
  const { data: insurances, isLoading: loadingInsurances } = useQuery('settings-insurances', async () => {
    const response = await api.get('/config/insurances');
    return response.data;
  }, { enabled: activeTab === 'insurances' });

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-6 h-6 text-gray-900" />
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        </div>
        
        {/* Tabs navigation */}
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="card">
        <div className="card-body">
          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Manage Users</h3>
              </div>
              {loadingUsers ? (
                <div className="p-8 text-center text-gray-500 animate-pulse">Loading users...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users?.map(user => (
                        <tr key={user.id}>
                          <td className="font-medium">{user.first_name} {user.last_name}</td>
                          <td className="text-gray-500">{user.username}</td>
                          <td>
                            <span className="badge badge-info">{user.role}</span>
                          </td>
                          <td>
                            {user.is_active ? 
                              <span className="badge badge-success">Active</span> : 
                              <span className="badge badge-danger">Inactive</span>
                            }
                          </td>
                        </tr>
                      ))}
                      {!users?.length && <tr><td colSpan="4" className="text-center py-4">No users found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CARE TEAMS TAB */}
          {activeTab === 'care_teams' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Care Teams</h3>
              </div>
              {loadingTeams ? (
                <div className="p-8 text-center text-gray-500 animate-pulse">Loading care teams...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {careTeams?.map(team => (
                    <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-lg text-gray-900 mb-2">{team.team_name}</h4>
                      <p className="text-sm text-gray-600 mb-4">{team.members_count} Members Assigned</p>
                      <div className="space-y-2">
                        {team.members?.map(member => (
                          <div key={member.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                            <span>{member.user_name}</span>
                            <span className="text-gray-500">{member.designation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!careTeams?.length && <p className="text-gray-500">No care teams found.</p>}
                </div>
              )}
            </div>
          )}

          {/* INSURANCES TAB */}
          {activeTab === 'insurances' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Eligible Insurances</h3>
              </div>
              {loadingInsurances ? (
                <div className="p-8 text-center text-gray-500 animate-pulse">Loading insurances...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Insurance Name</th>
                        <th>Create Claim Automatically</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insurances?.map(ins => (
                        <tr key={ins.id}>
                          <td className="font-medium">{ins.insurance_name}</td>
                          <td>
                            {ins.create_claim ? 
                              <span className="badge badge-success">Yes</span> : 
                              <span className="badge badge-warning">No</span>
                            }
                          </td>
                        </tr>
                      ))}
                      {!insurances?.length && <tr><td colSpan="2" className="text-center py-4">No insurances configured.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
