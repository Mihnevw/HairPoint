import React, { useState, useEffect } from 'react';
import { Link as ScrollLink } from 'react-scroll';
import { motion } from 'framer-motion';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    // Check initial scroll position
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', to: 'home' },
    { name: 'Services', to: 'services' },
    { name: 'Features', to: 'features' },
    { name: 'Gallery', to: 'gallery' },
    { name: 'FAQ', to: 'faq' },
    { name: 'Contact', to: 'contact' },
  ];

  return (
    <nav
      className={`fixed w-full z-[100] transition-all duration-300 ${isScrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-sm'
          : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <ScrollLink
            to="home"
            smooth={true}
            duration={500}
            offset={-64}
            className={`text-xl font-bold cursor-pointer ${isScrolled ? 'text-gray-900' : 'text-white'
              }`}
          >
            AF Barbershop
          </ScrollLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <ScrollLink
                key={item.to}
                to={item.to}
                smooth={true}
                duration={500}
                offset={-64}
                className={`cursor-pointer transition-colors ${isScrolled
                    ? 'text-gray-700 hover:text-gray-900'
                    : 'text-white hover:text-white/80'
                  }`}
              >
                {item.name}
              </ScrollLink>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-6 h-6 flex flex-col justify-around">
              <span
                className={`block w-full h-0.5 transition-all duration-300 ${isScrolled ? 'bg-gray-900' : 'bg-white'
                  } ${isMobileMenuOpen ? 'rotate-45 translate-y-2.5' : ''}`}
              />
              <span
                className={`block w-full h-0.5 transition-all duration-300 ${isScrolled ? 'bg-gray-900' : 'bg-white'
                  } ${isMobileMenuOpen ? 'opacity-0' : ''}`}
              />
              <span
                className={`block w-full h-0.5 transition-all duration-300 ${isScrolled ? 'bg-gray-900' : 'bg-white'
                  } ${isMobileMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{ height: isMobileMenuOpen ? 'auto' : 0 }}
          className={`md:hidden overflow-hidden ${isScrolled
              ? 'bg-white/95 backdrop-blur-sm'
              : 'bg-transparent'
            }`}
        >
          <div className="py-2 space-y-2">
            {navItems.map((item) => (
              <ScrollLink
                key={item.to}
                to={item.to}
                smooth={true}
                duration={500}
                offset={-64}
                className={`block cursor-pointer transition-colors py-2 px-4 ${isScrolled
                    ? 'text-gray-700 hover:text-gray-900'
                    : 'text-white hover:text-white/80'
                  }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </ScrollLink>
            ))}
          </div>
        </motion.div>
      </div>
    </nav>
  );
};

export default Navbar; 