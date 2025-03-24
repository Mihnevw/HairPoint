import Hero from './components/Hero';
import Services from './components/Services';
import Features from './components/Features';
import FAQ from './components/FAQ';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import GallerySection from './components/GallerySection';
//import InstagramFeeds from './components/InstagramFeeds';

//TODO: Add InstagramFeeds component
function App() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Services />
      <Features />
      <GallerySection />
      <FAQ />
      <ContactForm />
      {/* <InstagramFeeds /> */}
      <Footer />
    </div>
  );
}

export default App;
