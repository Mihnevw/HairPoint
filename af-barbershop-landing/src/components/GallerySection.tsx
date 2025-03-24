import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const images = [
  { before: '/before.png', after: '/after.png', title: 'Classic Fade' },
  { before: '/before-2.png', after: '/after-2.png', title: 'Modern Pompadour' },
  { before: '/before-3.png', after: '/after-3.png', title: 'Side Part' },
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
    <section id="gallery-section" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4">Before & After Gallery</h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Discover our transformation gallery showcasing the skill and artistry of our barbers.
          Hover over each image to see the before and after results.
        </p>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 50 }}
          animate={visible ? { opacity: 1, y: 0 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {images.map((img, index) => (
            <motion.div
              key={index}
              className="relative group rounded-lg overflow-hidden shadow-lg"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="aspect-w-4 aspect-h-3">
                <img
                  src={img.before}
                  alt={`Before - ${img.title}`}
                  className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                />
                <img
                  src={img.after}
                  alt={`After - ${img.title}`}
                  className="w-full h-full object-cover absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-lg font-semibold">{img.title}</h3>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default GallerySection;
