import { useState } from 'react';
import { Search, Bell, Heart, X, Star, MapPin, Users, Bed, Bath, Wifi, Car, Coffee, Tv, LayoutDashboard, Building2, CreditCard, BarChart3, Settings as SettingsIcon, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TunnetSectionFixed from '../components/TunnetSectionFixed';
import RentabilityDashboard from '../components/RentabilityDashboard';
// Removed OverviewDashboard import due to type resolution issues
import PaymentTracking from '../components/PaymentTracking';
import PropertiesSection from '../components/PropertiesSection';
import TokenDebug from '../components/TokenDebug';
import AdminManagement from './AdminManagement';

interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  image: string;
  tag: string;
  tagColor: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  rating: number;
  reviews: number;
  amenities: string[];
  images: string[];
  host: {
    name: string;
    avatar: string;
    joinDate: string;
  };
  propertyDetails: {
    propertyType: string;
    size: string;
    checkIn: string;
    checkOut: string;
  };
}

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  console.log('Dashboard user:', user);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);

  const closePropertyDetails = () => {
    setSelectedProperty(null);
    setIsPropertyModalOpen(false);
  };

  const renderPropertiesContent = () => <PropertiesSection />;

  const renderTunnetContent = () => {
    console.log('renderTunnetContent called, rendering TunnetSectionFixed');
    try {
      return <TunnetSectionFixed />;
    } catch (error) {
      console.error('Error rendering TunnetSectionFixed:', error);
      return (
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold text-red-600">Error Loading Tenants</h2>
          <p className="text-sm text-gray-600">There was an error loading the tenants section.</p>
          <p className="text-xs text-gray-500 mt-2">Error: {(error as any)?.message || 'Unknown error'}</p>
        </div>
      );
    }
  };

  const renderOverviewContent = () => (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold">Overview</h2>
      <p className="text-sm text-gray-600">Overview content coming soon.</p>
    </div>
  );

  const renderPaymentsContent = () => (
    <PaymentTracking />
  );

  


  const renderRentabilityContent = () => (
    <RentabilityDashboard />
  );

  const renderSettingsContent = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Debug Component */}
      <div className="mb-6">
        <TokenDebug />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
        <p className="text-gray-600 mb-4">Manage your account preferences and settings.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Name</label>
            <input
              type="text"
              defaultValue="Zeng Wen"
              placeholder="Enter your profile name"
              title="Profile name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              defaultValue="zeng.wen@property.com"
              placeholder="Enter your email"
              title="Email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Save Changes
          </button>
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'; }}
              className="w-full md:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminManagementContent = () => {
    console.log('Rendering AdminManagement component');
    return <AdminManagement />;
  };

  const renderContent = () => {
    console.log('Dashboard renderContent - activeSection:', activeSection);
    switch (activeSection) {
      case 'overview':
        console.log('Rendering overview content');
        return renderOverviewContent();
      case 'properties':
        console.log('Rendering properties content');
        return renderPropertiesContent();
      case 'tunnet':
        console.log('Rendering tunnet content (tenants)');
        return renderTunnetContent();
      case 'payments':
        console.log('Rendering payments content');
        return renderPaymentsContent();
      case 'rentability':
        console.log('Rendering rentability content');
        return renderRentabilityContent();
      case 'settings':
        console.log('Rendering settings content');
        return renderSettingsContent();
      case 'admin-management':
        console.log('Rendering admin management content');
        return renderAdminManagementContent();
      default:
        console.log('Rendering default overview content');
        return renderOverviewContent();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 animate-slide-in-left">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-display-medium text-gray-900 animate-fade-in">Dashboard</h1>
          <div className="mt-2 w-12 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-expand"></div>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            <button 
              onClick={() => setActiveSection('overview')}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-300 hover:transform hover:translate-x-1 ${
                activeSection === 'overview' 
                  ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600 animate-slide-in-right' 
                  : 'text-gray-600 hover:bg-gray-50 hover:shadow-md'
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 mr-3 ${activeSection === 'overview' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="nav-item">Overview</span>
            </button>
            
            <button 
              onClick={() => setActiveSection('properties')}
              className={`w-full flex items-center px-4 py-3 rounded-lg ${
                activeSection === 'properties' 
                  ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Building2 className={`w-5 h-5 mr-3 ${activeSection === 'properties' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="nav-item">Properties</span>
            </button>
            
            <button 
              onClick={() => {
                console.log('Tenants button clicked, setting activeSection to tunnet');
                setActiveSection('tunnet');
              }}
              className={`w-full flex items-center px-4 py-3 rounded-lg ${
                activeSection === 'tunnet' 
                  ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users className={`w-5 h-5 mr-3 ${activeSection === 'tunnet' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="nav-item">Tenants</span>
            </button>
            
            <button 
              onClick={() => setActiveSection('payments')}
              className={`w-full flex items-center px-4 py-3 rounded-lg ${
                activeSection === 'payments' 
                  ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CreditCard className={`w-5 h-5 mr-3 ${activeSection === 'payments' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="nav-item">Payments</span>
            </button>
            
            
            
            <button 
              onClick={() => setActiveSection('rentability')}
              className={`w-full flex items-center px-4 py-3 rounded-lg ${
                activeSection === 'rentability' 
                  ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className={`w-5 h-5 mr-3 ${activeSection === 'rentability' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="nav-item">Analytics</span>
            </button>
            
            <button 
              onClick={() => setActiveSection('settings')}
              className={`w-full flex items-center px-4 py-3 rounded-lg ${
                activeSection === 'settings' 
                  ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <SettingsIcon className={`w-5 h-5 mr-3 ${activeSection === 'settings' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="nav-item">Settings</span>
            </button>

            {user?.role === 'SUPER_ADMIN' && (
              <button 
                onClick={() => setActiveSection('admin-management')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-300 hover:transform hover:translate-x-1 ${
                  activeSection === 'admin-management' 
                    ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600 animate-slide-in-right' 
                    : 'text-gray-600 hover:bg-gray-50 hover:shadow-md'
                }`}
                title="Admin Management"
              >
                <Shield className={`w-5 h-5 mr-3 ${activeSection === 'admin-management' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="nav-item">Admin Management</span>
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 max-w-lg">
              <div className="relative w-full group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Search"
                  aria-label="Search properties"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md form-input"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600 hover:text-blue-600 cursor-pointer transition-colors duration-200 hover:animate-bounce-subtle" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200 cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                  alt="Profile"
                  className="w-10 h-10 rounded-full hover:ring-2 hover:ring-blue-300 transition-all duration-200"
                />
                <div>
                  <div className="text-label-large text-gray-900">Marie Dubois</div>
                  <div className="text-label-medium text-gray-500">Admin</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 animate-fade-in-up animate-delay-200">
        {renderContent()}
        </div>
      </div>

      {/* Property Details Modal */}
      {isPropertyModalOpen && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto transform animate-modal-slide-up">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-heading-large">{selectedProperty.title}</h2>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-label-large">{selectedProperty.rating}</span>
                    <span className="ml-1 card-subtitle">({selectedProperty.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center card-subtitle">
                    <MapPin className="w-4 h-4 mr-1" />
                    {selectedProperty.location}
                  </div>
                </div>
              </div>
                <button
                onClick={closePropertyDetails}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all duration-200 transform hover:scale-110"
                aria-label="Close property details"
              >
                <X className="w-6 h-6" />
                </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Image Gallery */}
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-1">
                    <img
                      src={selectedProperty.images[0]}
                      alt={selectedProperty.title}
                      className="w-full h-80 object-cover rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProperty.images.slice(1, 5).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${selectedProperty.title} ${index + 2}`}
                        className="w-full h-36 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Details */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Property Overview */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedProperty.propertyDetails.propertyType} hosted by {selectedProperty.host.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedProperty.tagColor === 'orange' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedProperty.tag}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{selectedProperty.guests} guests</span>
                      </div>
                      <div className="flex items-center">
                        <Bed className="w-4 h-4 mr-1" />
                        <span>{selectedProperty.bedrooms} bedrooms</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="w-4 h-4 mr-1" />
                        <span>{selectedProperty.bathrooms} bathrooms</span>
                      </div>
                    </div>

                    <p className="text-gray-700 leading-relaxed">{selectedProperty.description}</p>
                  </div>

                  {/* Amenities */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">What this place offers</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedProperty.amenities.map((amenity, index) => {
                        const getAmenityIcon = (amenity: string) => {
                          switch (amenity.toLowerCase()) {
                            case 'wifi': return <Wifi className="w-5 h-5" />;
                            case 'tv': return <Tv className="w-5 h-5" />;
                            case 'parking': return <Car className="w-5 h-5" />;
                            case 'coffee maker': return <Coffee className="w-5 h-5" />;
                            default: return <div className="w-5 h-5 bg-gray-300 rounded"></div>;
                          }
                        };

                        return (
                          <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                            {getAmenityIcon(amenity)}
                            <span className="text-gray-700">{amenity}</span>
                          </div>
              );
            })}
                    </div>
                  </div>

                  {/* Property Details */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Property Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Property Type</h4>
                        <p className="text-gray-700">{selectedProperty.propertyDetails.propertyType}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Size</h4>
                        <p className="text-gray-700">{selectedProperty.propertyDetails.size}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Check-in</h4>
                        <p className="text-gray-700">{selectedProperty.propertyDetails.checkIn}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Check-out</h4>
                        <p className="text-gray-700">{selectedProperty.propertyDetails.checkOut}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Booking Card */}
                <div className="lg:col-span-1">
                  <div className="sticky top-6">
                    {/* Host Info */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <img
                          src={selectedProperty.host.avatar}
                          alt={selectedProperty.host.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">Hosted by {selectedProperty.host.name}</h4>
                          <p className="text-sm text-gray-600">{selectedProperty.host.joinDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Booking Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="price-large">{selectedProperty.price}€</span>
                          <span className="text-body-small text-gray-500 ml-1">mois</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-label-large">{selectedProperty.rating}</span>
                        </div>
          </div>

                      {/* Booking Form */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="form-label mb-1">Check-in Date</label>
                            <input
                              type="date"
                              placeholder="Select check-in date"
                              title="Check-in date"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 form-input"
                            />
                          </div>
                          <div>
                            <label className="form-label mb-1">Lease Duration</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 form-input" title="Lease duration">
                              <option>3 months</option>
                              <option>6 months</option>
                              <option>12 months</option>
                              <option>Month by month</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="form-label mb-1">Room Type</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 form-input" title="Room type">
                            <option>Private room</option>
                            <option>Shared room</option>
                            <option>Master room</option>
                          </select>
                        </div>
                        <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors btn-text">
                          Apply Now
                        </button>
                        <div className="flex items-center justify-center">
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Add to favorites">
                            <Heart className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 text-center">Application review required</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;