import { useEffect, useState } from 'react';

const INSTAGRAM_USER_ID = '110889977242232' as string;
const INSTAGRAM_ACCESS_TOKEN = 'EAAYSRCGJ2QcBO1QfLZBhuhdE63N4aZCzuLZCNMpDDxFATga1ZCTlE5c2ysUpkM5nkJaqpwh4vLPHTjjMbIBP6pvNczldN1BfcJV5g0og1DabOtxutt1fk47dKZB7TMZA01s9ZAxZASAPR08T4ZBnDmyf7YyKNMht52aa9EzR9Ulxn7Wn8PZCi4vuBVldsHP22p4NYHhZCZCBweHwaYUbDei4BQZDZD' as string;
const INSTAGRAM_API_URL = `https://graph.facebook.com/v17.0/${INSTAGRAM_USER_ID}/media?fields=id,media_type,media_url,permalink&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

interface InstagramPost {
  id: string;
  media_type: string;
  media_url: string;
  permalink: string;
}

const InstagramFeed: React.FC = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstagramPosts = async () => {
      try {
        const response = await fetch(INSTAGRAM_API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setPosts(data.data || []);
      } catch (err) {
        setError('Error fetching Instagram posts: ' + (err as Error).message);
      }
    };

    fetchInstagramPosts();
  }, []);

  if (error) {
    return <p>Грешка при зареждането на постовете: {error}</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {posts.map((post) => (
        <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer">
          <img
            src={post.media_url}
            alt="Instagram post"
            className="w-full h-auto rounded-xl hover:scale-105 transition-transform duration-300"
          />
        </a>
      ))}
    </div>
  );
};

export default InstagramFeed;
