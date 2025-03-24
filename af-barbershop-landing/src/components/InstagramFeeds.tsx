// InstagramFeeds.tsx
import { useEffect, useState } from 'react';

interface InstagramPost {
  id: string;
  media_url: string;
  permalink: string;
  caption?: string;
}

const InstagramFeeds: React.FC = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInstagramPosts = async () => {
      try {
        const response = await fetch(process.env.REACT_APP_INSTAGRAM_API_URL || 'http://localhost:5000/instagram-feed');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPosts(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching Instagram posts');
      } finally {
        setLoading(false);
      }
    };
  
    fetchInstagramPosts();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error: {error}</p>
        <p className="text-gray-600 mt-2">Please try again later</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No posts available at the moment</p>
      </div>
    );
  }

  return (
    <div className="instagram-feed-container max-w-6xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-center mb-6">Latest Haircuts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {posts.map((post) => (
          <div key={post.id} className="insta-post relative overflow-hidden aspect-square group">
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={post.media_url}
                alt={post.caption || 'Barbershop haircut'}
                className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="overlay absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstagramFeeds;