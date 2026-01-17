/**
 * User Profile Page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, MapPin, Calendar, Shield, CreditCard, Package, Heart, Camera, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut, userRole } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    phone: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Wait for auth loading to settle to avoid redirect race when test users are injected
    if (loading) return;
    if (user) {
      fetchUserProfile();
      fetchUserOrders();
      fetchUserWishlist();
    } else {
      router.push('/auth/login');
    }
  }, [user, loading]);

  const fetchUserProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      const profileData = profile || {
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
        location: '',
        phone: '',
        avatar_url: '',
        created_at: user.created_at,
      };

      setUserProfile(profileData);
      setFormData({
        name: profileData.full_name || '',
        email: profileData.email || '',
        location: profileData.location || '',
        phone: profileData.phone || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              product_name,
              images,
              base_price
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching orders:', error);
      } else {
        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchUserWishlist = async () => {
    try {
      const { data: wishlistData, error } = await supabase
        .from('wishlists')
        .select(`
          *,
          products (
            product_name,
            images,
            base_price,
            sales_count
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching wishlist:', error);
      } else {
        setWishlist(wishlistData || []);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.name,
          email: formData.email,
          location: formData.location,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
      } else {
        setUserProfile({ ...userProfile, ...formData });
        setIsEditing(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      location: user.location,
      phone: user.phone || '',
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center overflow-hidden">
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {userProfile?.full_name || 'User'}
                </h1>
                <div className="flex items-center space-x-4 text-gray-600">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{userProfile?.email}</span>
                  </div>
                  {user.email_confirmed_at && (
                    <div className="flex items-center text-green-600">
                      <Shield className="w-4 h-4 mr-1" />
                      <span className="text-sm">Verified</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center text-gray-500 mt-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    Member since {userProfile?.created_at ?
                      new Date(userProfile.created_at).toLocaleDateString() :
                      new Date(user.created_at).toLocaleDateString()
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-4 mt-3">
                  {/* Role badge */}
                  {userRole && (
                    <div className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-semibold">
                      {userRole === 'supplier' ? 'Supplier' : userRole === 'admin' ? 'Admin' : 'Citizen'}
                    </div>
                  )}

                  {/* Debug info (non-production only) */}
                  {process.env.NODE_ENV !== 'production' && (
                    <div data-testid="auth-debug" className="text-xs text-gray-400 ml-4">
                      {JSON.stringify({ user: user?.email || null, userRole, loading })}
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Package className="w-4 h-4 mr-1" />
                    <span>{orders.length} orders</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Heart className="w-4 h-4 mr-1" />
                    <span>{wishlist.length} favorites</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Edit Profile
                </button>
              )}
              <button
                onClick={signOut}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'avatar', label: '3D Avatar', icon: Camera },
                { id: 'orders', label: 'Orders', icon: Package },
                { id: 'wishlist', label: 'Wishlist', icon: Heart },
                { id: 'payment', label: 'Payment Methods', icon: CreditCard },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="City, Country"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-4 mt-8">
                    <button 
                      onClick={handleCancel}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'avatar' && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">3D Avatar</h2>
                  <p className="text-gray-600">Generate and manage your personalized 3D avatar</p>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => router.push('/profile/avatar')}
                    className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-medium"
                  >
                    <Camera className="w-5 h-5 inline mr-2" />
                    Generate 3D Avatar
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">Order #{order.id.slice(-8)}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">${order.total_amount?.toFixed(2)}</p>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-4 overflow-x-auto">
                          {order.order_items?.slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="flex-shrink-0">
                              <img
                                src={item.products?.images?.[0] || '/placeholder-product.jpg'}
                                alt={item.products?.product_name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            </div>
                          ))}
                          {order.order_items?.length > 3 && (
                            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-sm text-gray-600">+{order.order_items.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No orders yet</p>
                    <button
                      onClick={() => router.push('/discover')}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist</h2>
                {wishlist.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <img
                          src={item.products?.images?.[0] || '/placeholder-product.jpg'}
                          alt={item.products?.product_name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {item.products?.product_name}
                          </h3>
                          <p className="text-purple-600 font-bold mb-2">
                            ${item.products?.base_price?.toFixed(2)}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-600">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              <span>{item.products?.sales_count || 0} sold</span>
                            </div>
                            <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                    <button
                      onClick={() => router.push('/discover')}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Discover Products
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payment' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Methods</h2>
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No payment methods saved</p>
                  <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Add Payment Method
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
