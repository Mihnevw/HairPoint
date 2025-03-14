import { motion } from 'framer-motion';
import ServiceCard from './ServiceCard';

const services = [
  {
    title: 'Мъжко подстригване',
    description: 'Професионално подстригване със стил и внимание към детайла',
    price: '18',
    type: 'haircut' as const,
  },
  {
    title: 'Бръснене',
    description: 'Класическо бръснене с топла кърпа и масаж на лицето',
    price: '25',
    type: 'shave' as const,
  },
  {
    title: 'Боядисване',
    description: 'Професионално боядисване с качествени продукти',
    price: '45',
    type: 'dye' as const,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Services = () => {
  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">Нашите Услуги</h2>
          <p className="text-xl text-gray-600">
            Професионални услуги за вашата визия
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service, index) => (
            <motion.div key={index} variants={item}>
              <ServiceCard {...service} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Services; 