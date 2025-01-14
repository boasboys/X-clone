import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/db/date/index.js";

const Post = ({ post, feedType, username, userId }) => {
  const [comment, setComment] = useState("");
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const queryClient = useQueryClient();

  const postOwner = post.username;
  const isLiked = post.likes.includes(authUser._id);
  const isMyPost = authUser._id === post.username._id;

  const formattedDate = formatPostDate(post.createdAt);

  /**
   * DELETE POST (Optimistic Update)
   */
  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      // actual API call
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      return data; // e.g., { message: "Post deleted successfully" }
    },

    // OPTIMISTIC UPDATE
    onMutate: async () => {
      // 1. Cancel any in-flight queries
      await queryClient.cancelQueries(["posts", feedType, username, userId]);

      // 2. Snapshot previous data
      const previousPosts = queryClient.getQueryData([
        "posts",
        feedType,
        username,
        userId,
      ]);

      // 3. Optimistically remove this post from the cache
      queryClient.setQueryData(
        ["posts", feedType, username, userId],
        (oldPosts) => {
          if (!oldPosts) return [];
          return oldPosts.filter((p) => p._id !== post._id);
        }
      );

      // 4. Return context for potential rollback
      return { previousPosts };
    },

    // Roll back if error
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(
          ["posts", feedType, username, userId],
          context.previousPosts
        );
      }
      toast.error(err.message);
    },

    // Refetch in the background to confirm
    onSettled: () => {
      queryClient.invalidateQueries(["posts", feedType, username, userId]);
    },

    onSuccess: () => {
      toast.success("Post deleted successfully");
    },
  });

  /**
   * LIKE POST (Optimistic Update) - Already implemented
   */
  const { mutate: likePost, isPending: isLiking } = useMutation({
    mutationFn: async () => {
      // Actual API call
      const res = await fetch(`/api/posts/like/${post._id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      return data; // e.g., array of updated likes or the updated post
    },

    onMutate: async () => {
      await queryClient.cancelQueries(["posts", feedType, username, userId]);

      const previousPosts = queryClient.getQueryData([
        "posts",
        feedType,
        username,
        userId,
      ]);

      // Optimistically update likes for this post
      queryClient.setQueryData(
        ["posts", feedType, username, userId],
        (oldPosts) => {
          if (!oldPosts) return [];
          return oldPosts.map((p) => {
            if (p._id === post._id) {
              return {
                ...p,
                likes: [...p.likes, authUser._id],
              };
            }
            return p;
          });
        }
      );

      return { previousPosts };
    },

    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(
          ["posts", feedType, username, userId],
          context.previousPosts
        );
      }
      toast.error(err.message);
    },

    onSettled: () => {
      queryClient.invalidateQueries(["posts", feedType, username, userId]);
    },
  });

  /**
   * COMMENT POST (Optimistic Update)
   */
  const { mutate: commentPost, isPending: isCommenting } = useMutation({
    mutationFn: async (commentText) => {
      // actual API call
      const res = await fetch(`/api/posts/comment/${post._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: commentText }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      // server might return the updated post or just the new comment
      return data;
    },

    onMutate: async (commentText) => {
      // 1. Cancel any in-flight queries
      await queryClient.cancelQueries(["posts", feedType, username, userId]);

      // 2. Snapshot previous data
      const previousPosts = queryClient.getQueryData([
        "posts",
        feedType,
        username,
        userId,
      ]);

      // 3. Optimistically update the comments for this post
      queryClient.setQueryData(
        ["posts", feedType, username, userId],
        (oldPosts) => {
          if (!oldPosts) return [];
          return oldPosts.map((p) => {
            if (p._id === post._id) {
              return {
                ...p,
                comments: [
                  ...p.comments,
                  {
                    _id: "optimisticCommentId", // temporary ID
                    text: commentText,
                    user: {
                      _id: authUser._id,
                      username: authUser.username,
                      fullName: authUser.fullName,
                      profileImg: authUser.profileImg,
                    },
                  },
                ],
              };
            }
            return p;
          });
        }
      );

      // 4. Return context (rollback if error)
      return { previousPosts };
    },

    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(
          ["posts", feedType, username, userId],
          context.previousPosts
        );
      }
      toast.error(err.message);
    },

    onSettled: () => {
      queryClient.invalidateQueries(["posts", feedType, username, userId]);
    },

    onSuccess: () => {
      setComment("");
      // toast.success("Comment posted successfully");
    },
  });

  // Handlers
  const handleDeletePost = () => {
    deletePost();
  };

  const handleLikePost = () => {
    if (isLiking) return;
    likePost();
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (isCommenting || !comment.trim()) return;
    // pass the actual comment text to onMutate
    commentPost(comment.trim());
  };

  return (
    <>
      <div className="flex gap-2 items-start p-4 border-b border-gray-700">
        <div className="avatar">
          <Link to={`/profile/${postOwner._id}`} className="w-8 rounded-full overflow-hidden">
            <img src={postOwner.profileImg || "/avatar-placeholder.png"} />
          </Link>
        </div>

        <div className="flex flex-col flex-1">
          {/* Post Header */}
          <div className="flex gap-2 items-center">
            <Link to={`/profile/${postOwner._id}`} className="font-bold">
              {postOwner.fullName}
            </Link>
            <span className="text-gray-700 flex gap-1 text-sm">
              <Link to={`/profile/${postOwner._id}`}>@{postOwner.username}</Link>
              <span>·</span>
              <span>{formattedDate}</span>
            </span>

            {isMyPost && (
              <span className="flex justify-end flex-1">
                {!isDeleting && (
                  <FaTrash
                    className="cursor-pointer hover:text-red-500"
                    onClick={handleDeletePost}
                  />
                )}
                {isDeleting && <LoadingSpinner size="sm" />}
              </span>
            )}
          </div>

          {/* Post Content */}
          <div className="flex flex-col gap-3 overflow-hidden">
            <span>{post.text}</span>
            {post.img && (
              <img
                src={post.img}
                className="h-80 object-contain rounded-lg border border-gray-700"
                alt=""
              />
            )}
          </div>

          {/* Post Footer: Comments, Like, etc. */}
          <div className="flex justify-between mt-3">
            <div className="flex gap-4 items-center w-2/3 justify-between">
              {/* Comments Trigger */}
              <div
                className="flex gap-1 items-center cursor-pointer group"
                onClick={() =>
                  document.getElementById("comments_modal" + post._id).showModal()
                }
              >
                <FaRegComment className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
                <span className="text-sm text-slate-500 group-hover:text-sky-400">
                  {post.comments.length}
                </span>
              </div>

              {/* Comments Modal (DaisyUI) */}
              <dialog id={`comments_modal${post._id}`} className="modal border-none outline-none">
                <div className="modal-box rounded border border-gray-600">
                  <h3 className="font-bold text-lg mb-4">COMMENTS</h3>
                  <div className="flex flex-col gap-3 max-h-60 overflow-auto">
                    {post.comments.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No comments yet 🤔 Be the first one 😉
                      </p>
                    )}
                    {post.comments.map((comment) => (
                      <div key={comment._id} className="flex gap-2 items-start">
                        <div className="avatar">
                          <div className="w-8 rounded-full">
                            <img src={comment.user.profileImg || "/avatar-placeholder.png"} />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="font-bold">{comment.user.fullName}</span>
                            <span className="text-gray-700 text-sm">
                              @{comment.user.username}
                            </span>
                          </div>
                          <div className="text-sm">{comment.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form
                    className="flex gap-2 items-center mt-4 border-t border-gray-600 pt-2"
                    onSubmit={handlePostComment}
                  >
                    <textarea
                      className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none border-gray-800"
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <button className="btn btn-primary rounded-full btn-sm text-white px-4">
                      {isCommenting ? <LoadingSpinner size="md" /> : "Post"}
                    </button>
                  </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                  <button className="outline-none">close</button>
                </form>
              </dialog>

              {/* Repost Placeholder */}
              <div className="flex gap-1 items-center group cursor-pointer">
                <BiRepost className="w-6 h-6 text-slate-500 group-hover:text-green-500" />
                <span className="text-sm text-slate-500 group-hover:text-green-500">0</span>
              </div>

              {/* Like Button */}
              <div className="flex gap-1 items-center group cursor-pointer" onClick={handleLikePost}>
                {isLiking && <LoadingSpinner size="sm" />}
                {!isLiked && !isLiking && (
                  <FaRegHeart className="w-4 h-4 text-slate-500 group-hover:text-pink-500" />
                )}
                {isLiked && !isLiking && <FaRegHeart className="w-4 h-4 text-pink-500" />}
                <span
                  className={`text-sm group-hover:text-pink-500 ${
                    isLiked ? "text-pink-500" : "text-slate-500"
                  }`}
                >
                  {post.likes.length}
                </span>
              </div>
            </div>

            {/* Bookmark Placeholder */}
            <div className="flex w-1/3 justify-end gap-2 items-center">
              <FaRegBookmark className="w-4 h-4 text-slate-500 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Post;