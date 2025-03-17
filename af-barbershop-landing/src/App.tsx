import Hero from './components/Hero';
import Services from './components/Services';
import Features from './components/Features';
import FAQ from './components/FAQ';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import InstagramFeed from './components/InstagramFeed';
import GallerySection from './components/GallerySection';
function App() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Services />
      <Features />
      <FAQ />
      <GallerySection />
      <ContactForm />
      <InstagramFeed /> 
      <Footer />
    </div>
  );
}

export default App;
