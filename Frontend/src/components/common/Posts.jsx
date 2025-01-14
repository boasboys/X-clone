import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useQuery } from "@tanstack/react-query";

const Posts = ({ feedType, username, userId }) => {
  // 1. Instead of a single /api/posts/all, build the endpoint dynamically
  const getPostEndpoint = () => {
    switch (feedType) {
      case "forYou":
        return "/api/posts/all";
      case "following":
        return `/api/posts/following/${userId}`;
      case "posts":
        return `/api/posts/${userId}`;
      case "likes":
        return `/api/posts/likes/${userId}`;
      default:
        return "/api/posts/all";
    }
  };

  const POST_ENDPOINT = getPostEndpoint();

  // 2. Include feedType, username, userId in queryKey so the query refetches automatically
  const {
    data: posts,
    isLoading,
    isFetching, // rename isRefetching → isFetching for clarity
    error,
  } = useQuery({
    // This ensures a *new* query whenever feedType, username, or userId changes
    queryKey: ["posts", feedType, username, userId],
    queryFn: async () => {
      const res = await fetch(POST_ENDPOINT);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      return data;
    },
    // You can also specify `enabled: !!feedType` if you only want it to run after feedType is set
  });

  if (error) {
    return <p className="text-center my-4 text-red-400">{error.message}</p>;
  }

  return (
    <>
      {(isLoading || isFetching) && (
        <div className="flex flex-col justify-center">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}
      {!isLoading && !isFetching && posts?.length === 0 && (
        <p className="text-center my-4">No posts in this tab. Switch 👻</p>
      )}
      {!isLoading && !isFetching && posts && (
        <div>
          {posts.map((post) => (
            <Post key={post._id} post={post} feedType={feedType} username={username} userId={userId} />
          ))}
        </div>
      )}
    </>
  );
};

export default Posts;