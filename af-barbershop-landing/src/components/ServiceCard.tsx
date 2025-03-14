import { motion } from 'framer-motion';
import { ScissorsIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface ServiceCardProps {
  title: string;
  description: string;
  price: string;
  type: 'haircut' | 'shave' | 'dye';
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, price, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'haircut':
        return <ScissorsIcon className="w-8 h-8" />;
      case 'shave':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        );
      case 'dye':
        return <SparklesIcon className="w-8 h-8" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white p-6 rounded-xl shadow-soft hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-accent-500 bg-opacity-10 rounded-lg text-accent-600">
          {getIcon()}
        </div>
        <span className="text-2xl font-bold text-accent-600">{price} лв</span>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

export default ServiceCard; 