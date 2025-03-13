import React from 'react';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon, 
  SparklesIcon, 
  HomeIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: UserGroupIcon,
    title: 'Професионален екип',
    description: 'Нашите фризьори имат опит в сферата и са отворени към работа с всеки клиент'
  },
  {
    icon: SparklesIcon,
    title: 'Качествени продукти',
    description: 'Използваме само най-добрите козметични продукти'
  },
  {
    icon: HomeIcon,
    title: 'Уникална атмосфера',
    description: 'Модерен дизайн и уютна среда за ваше удоволствие'
  },
  {
    icon: ClockIcon,
    title: 'Гъвкаво работно време',
    description: 'Работим в удобно за вас време'
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 text-gray-900">
            Защо да изберете нас?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Предлагаме най-добрите услуги за вашата коса и брада с внимание към всеки детайл
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="card p-8 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 hover:bg-gray-200 hover:scale-105 hover:shadow-gray-300"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-accent-100 rounded-full transform -rotate-6"></div>
                <div className="relative">
                  <feature.icon className="w-12 h-12 text-accent-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <div>
            <div className="text-4xl font-bold text-accent-600 mb-2">5+</div>
            <div className="text-gray-600">Години опит</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent-600 mb-2">1000+</div>
            <div className="text-gray-600">Доволни клиенти</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent-600 mb-2">4</div>
            <div className="text-gray-600">Професионалисти</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent-600 mb-2">4.9</div>
            <div className="text-gray-600">Рейтинг в Google</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features; 