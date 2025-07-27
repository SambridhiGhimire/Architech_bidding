import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Building2,
  Users,
  FileText,
  MessageSquare,
  Star,
  Shield,
  ArrowRight,
  CheckCircle,
  Zap,
  Globe,
  Award,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Play,
  Pause,
} from "lucide-react";

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    setIsVisible(true);

    const interval = setInterval(() => {
      if (isPlaying) {
        setActiveSection((prev) => (prev + 1) % 3);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const features = [
    {
      icon: <Building2 className="w-8 h-8" />,
      title: "Smart Project Management",
      description: "Create and manage construction projects with AI-powered insights and detailed specifications.",
      color: "from-blue-500 to-cyan-500",
      delay: "0ms",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Verified Network",
      description: "Connect with pre-verified contractors and suppliers with proven track records.",
      color: "from-green-500 to-emerald-500",
      delay: "100ms",
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Intelligent Bidding",
      description: "Receive and compare bids with AI-powered analysis and detailed proposals.",
      color: "from-purple-500 to-pink-500",
      delay: "200ms",
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Real-time Communication",
      description: "Chat directly with contractors and architects with instant notifications.",
      color: "from-orange-500 to-red-500",
      delay: "300ms",
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Trust & Transparency",
      description: "Rate and review contractors based on project completion and quality.",
      color: "from-yellow-500 to-amber-500",
      delay: "400ms",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Enterprise Security",
      description: "Your data and communications are protected with military-grade security.",
      color: "from-indigo-500 to-blue-500",
      delay: "500ms",
    },
  ];

  const stats = [
    { number: "500+", label: "Active Projects", icon: <TrendingUp className="w-6 h-6" /> },
    { number: "1000+", label: "Verified Contractors", icon: <Users className="w-6 h-6" /> },
    { number: "50+", label: "Cities Covered", icon: <Globe className="w-6 h-6" /> },
    { number: "4.8", label: "Average Rating", icon: <Star className="w-6 h-6" /> },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Architect",
      company: "Design Studio Pro",
      content: "Architect has revolutionized how we connect with contractors. The bidding process is now seamless and transparent.",
      rating: 5,
      avatar: "SJ",
    },
    {
      name: "Michael Chen",
      role: "Contractor",
      company: "Chen Construction",
      content: "This platform has given us access to quality projects we never had before. The communication tools are excellent.",
      rating: 5,
      avatar: "MC",
    },
    {
      name: "Emily Rodriguez",
      role: "Project Manager",
      company: "Urban Development Co",
      content: "The project management features are incredible. We've reduced our project timeline by 30% using this platform.",
      rating: 5,
      avatar: "ER",
    },
  ];

  const benefits = [
    "Save up to 40% on project costs",
    "Reduce project timeline by 30%",
    "Access to verified contractors",
    "Real-time project tracking",
    "Secure payment processing",
    "24/7 customer support",
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
        <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="relative">
                  <Building2 className="w-8 h-8 text-blue-600 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Architect</span>
              </div>
              <div className="flex items-center space-x-4">
                {!isAuthenticated ? (
                  <>
                    <Link to="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105">
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 transform"
                    >
                      Get Started
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/dashboard"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 transform"
                  >
                    Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Connect <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">Architects</span> with{" "}
                <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">Contractors</span>
              </h1>
            </div>

            <div className={`transition-all duration-1000 delay-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                The next-generation construction bidding platform that brings project owners and service providers together. Upload your project, receive competitive bids, and
                build with confidence.
              </p>
            </div>

            <div className={`transition-all duration-1000 delay-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/register"
                      className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transition-all duration-300 hover:scale-105 transform flex items-center justify-center"
                    >
                      Start Your Project
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/register"
                      className="group border-2 border-blue-600 text-blue-600 px-10 py-4 rounded-full text-lg font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300 hover:scale-105 transform"
                    >
                      Join as Contractor
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/dashboard"
                    className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transition-all duration-300 hover:scale-105 transform flex items-center justify-center"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
            </div>

            {/* Scroll Indicator */}
            <div
              className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-1000 delay-700 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <span className="text-sm text-gray-500">Scroll to explore</span>
                <ChevronDown className="w-6 h-6 text-gray-400 animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-all duration-300" style={{ animationDelay: `${index * 200}ms` }}>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4 group-hover:shadow-lg transition-all duration-300">
                  <div className="text-white">{stat.icon}</div>
                </div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{stat.number}</div>
                <div className="text-gray-600 mt-2 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Build</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our platform provides all the tools and features you need to manage construction projects efficiently and successfully.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:scale-105 transform"
                style={{ animationDelay: feature.delay }}
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl mb-6 group-hover:scale-110 transition-all duration-300`}
                >
                  <div className="text-white">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Why Choose <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Architect?</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">Join thousands of satisfied users who have transformed their construction projects with our platform.</p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3 group">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-white">
                <div className="text-center">
                  <Zap className="w-16 h-16 mx-auto mb-6 animate-pulse" />
                  <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Projects?</h3>
                  <p className="text-blue-100 mb-6">Join our platform today and experience the future of construction project management.</p>
                  <Link to="/register" className="inline-flex items-center bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                    Get Started Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Users Say</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Don't just take our word for it. Here's what industry professionals are saying about Architect.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:scale-105 transform">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join thousands of project owners and contractors who are already building better together with Architect.
          </p>
          {!isAuthenticated ? (
            <Link
              to="/register"
              className="inline-flex items-center bg-white text-blue-600 px-10 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105 transform shadow-lg"
            >
              Create Your Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="inline-flex items-center bg-white text-blue-600 px-10 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105 transform shadow-lg"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-6">
                <Building2 className="w-8 h-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Architect</span>
              </div>
              <p className="text-gray-400 leading-relaxed">Connecting architects with contractors for better construction projects. Building the future, one project at a time.</p>
              <div className="flex space-x-4 mt-6">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors cursor-pointer">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors cursor-pointer">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Platform</h3>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <button className="hover:text-white text-left transition-colors">How it Works</button>
                </li>
                <li>
                  <button className="hover:text-white text-left transition-colors">Features</button>
                </li>
                <li>
                  <button className="hover:text-white text-left transition-colors">Pricing</button>
                </li>
                <li>
                  <button className="hover:text-white text-left transition-colors">Success Stories</button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <button className="hover:text-white text-left transition-colors">Help Center</button>
                </li>
                <li>
                  <button className="hover:text-white text-left transition-colors">Contact Us</button>
                </li>
                <li>
                  <button className="hover:text-white text-left transition-colors">Community</button>
                </li>
                <li>
                  <button className="hover:text-white text-left transition-colors">Status</button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Legal</h3>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <button className="hover:text-white text-left transition-colors">Terms of Service</button>
                </li>
                <li>
                  <button className="hover:text-white text-left transition-colors">Privacy Policy</button>
                </li>
                <li>
                  <button className="hover:text-white text-left transition-colors">Cookie Policy</button>
                </li>
                <li>
                  <button className="hover:text-white text-left transition-colors">GDPR</button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Architect. All rights reserved. Building the future together.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
