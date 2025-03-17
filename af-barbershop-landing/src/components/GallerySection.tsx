import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const images = [
  { before: '/before.png',  after: '/after.png' },
  { before: '/before-2.png',  after: '/after-2.png' },
];

const GallerySection = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById('gallery-section');
      if (section) {
        const rect = section.getBoundingClientRect();
        setVisible(rect.top < window.innerHeight && rect.bottom >= 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="gallery-section" className="p-8">
      <h2 className="text-3xl font-bold text-center mb-8">Gallery: Before & After</h2>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0, y: 50 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        {images.map((img, index) => (
          <div key={index} className="relative group">
            <img
              src={img.before}
              alt="Before"
              className="w-full h-auto rounded-lg transition-opacity duration-500 group-hover:opacity-0"
            />
            <img
              src={img.after}
              alt="After"
              className="w-full h-auto rounded-lg absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          </div>
        ))}
      </motion.div>
    </section>
  );
};

export default GallerySection;
