import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import Posts from "../../components/common/Posts";
import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton";
import EditProfileModal from "./EditProfileModal";

import { POSTS } from "../../utils/db/dummy";

import { FaArrowLeft } from "react-icons/fa6";
import { IoCalendarOutline } from "react-icons/io5";
import { FaLink } from "react-icons/fa";
import { MdEdit } from "react-icons/md";

import useFollow from "../../hooks/useFollow";

const ProfilePage = () => {
  console.log("=== ProfilePage component mounted ==="); // Debug
// const {mutate:updateImg} = useMutation({
// 	mutationKey:["updateUser"],
// 	mutationFn: async (profileImg,coverImg) => {
// 		try {
// 			const res = await fetch(`/api/user/update`,{
// 				method:"POST" ,
// 				headers: {
// 					"Content-type":"application/json",
// 					body:JSON.stringify(profileImg,coverImg)
// 				}
				
// 			})
// 			const data = await res.json()
// 			if(!res.ok)
// 			{
// 				throw new Error(data.error || "Something went wrong")
// 			}
// 		} catch (error) {
// 			throw new Error(error)
// 		}
		
// 	}
// })
  // React Query
  const queryClient = useQueryClient();

  // Local State
  const [coverImg, setCoverImg] = useState(null);
  const [profileImg, setProfileImg] = useState(null);
  const [feedType, setFeedType] = useState("posts");

  // Refs
  const coverImgRef = useRef(null);
  const profileImgRef = useRef(null);

  // Grab the username from the URL
  const {username:userId} = useParams();
  
  console.log("Current userId param:", userId); // Debug

  // Auth User Query
  const { data: authUser } = useQuery({
    queryKey: ["authUser"],
    // If you have a queryFn for authUser, place it here; or if it’s set up globally, that's fine.
  });
  console.log("authUser from useQuery:", authUser); // Debug

  // Follow / Unfollow Hook
  const { follow, isPending } = useFollow();

  // Fetch User by Username
  const {
    data: user,
    isLoading,
    refetch,
    isRefetching,
    error,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      try {
        console.log("=== Fetching user profile for:", userId); // Debug
        const res = await fetch(`/api/user/profile/${userId}`);
        const data = await res.json();

        if (!res.ok) {
          console.log("Server returned error. Status:", res.status, data); // Debug
          throw new Error(data.error || "Something went wrong");
        }

        console.log("Fetched user profile successfully:", data); // Debug
        return data;
      } catch (err) {
        console.log("Error in userProfile queryFn:", err); // Debug
        throw new Error(err);
      }
    },
	onSuccess:()=>
	{
		queryClient.invalidateQueries({queryKey:["authUser"]})
	}
  });

  // If there's an error from the userProfile query, you can handle it
  if (error) {
    console.log("Query error for userProfile:", error.message); // Debug
  }

  // Check if the profile belongs to the authenticated user
  const isMyProfile = authUser?._id === userId;
  console.log("Is this my profile?", isMyProfile); // Debug

  // For UI: year user joined
  let Year = authUser ? new Date(authUser.createdAt).getFullYear() : "";
  const date = new Date(authUser.createdAt)
  const Month = authUser ? new Intl.DateTimeFormat('en-US',{month: 'long'}).format(date) : ""
 	Year =   Month + " " + Year
  // useEffect to refetch if the username changes
  useEffect(() => {
    console.log("useEffect -> username changed or force refetch");
    refetch();
  }, [userId, refetch]);

  // Handle selecting cover/profile images
  const handleImgChange = (e, state) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Selected file for", state, ":", file.name); // Debug
      const reader = new FileReader();
      reader.onload = () => {
        if (state === "coverImg") {
          setCoverImg(reader.result);
          console.log("Updated coverImg (base64)"); // Debug
        }
        if (state === "profileImg") {
          setProfileImg(reader.result);
          console.log("Updated profileImg (base64)"); // Debug
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Mock function to illustrate how you'd update the user's images
  // Replace it with a real mutation if you have one
  const { mutate: editProfileImages, isLoading: isEditingProfile ,isRefetching:IsRefetching} = useMutation({
	mutationFn: async ({ newCoverImg, newProfileImg }) => {
	  // This request ONLY sends coverImg & profileImg.
	  const res = await fetch(`/api/user/update`, {
		method: "POST",
		headers: {
		  "Content-Type": "application/json",
		},
		body: JSON.stringify({
		  coverImg: newCoverImg,
		  profileImg: newProfileImg,
		}),
	  });
	  const data = await res.json();
	  if (!res.ok) {
		throw new Error(data.error || "Something went wrong updating images");
	  }
	  return data;
	},
	onSuccess: (updatedUser) => {
	  toast.success("Profile images updated!");
	  // Invalidate your queries so UI is fresh
	Promise.all([
		queryClient.invalidateQueries(["authUser"]),
		queryClient.invalidateQueries(["userProfile"])
	])	
	 
	  // Reset local states
	  setCoverImg(null);
	  setProfileImg(null);
	},
	onError: (err) => {
	  toast.error(err.message);
	},
  });
  
  // Then you call it like so:
  const handleUpdateProfile = () => {
	editProfileImages({
	  newCoverImg: coverImg,
	  newProfileImg: profileImg,
	});
	// setCoverImg(null)
	// setProfileImg(null)
  };

 

  // For debugging feedType changes
  const changeFeedType = (type) => {
    console.log("Switching feedType from", feedType, "to", type); // Debug
    setFeedType(type);
  };

  return (
    <>
      <div className="flex-[4_4_0] border-r border-gray-700 min-h-screen">
        {/* HEADER */}
        {(isLoading || isRefetching) && <ProfileHeaderSkeleton />}
        {!isLoading && !user && (
          <p className="text-center text-lg mt-4">User not found</p>
        )}

        <div className="flex flex-col">
          {(!isLoading || !isRefetching) && user && (
            <>
              {/* Top Nav w/ Arrow & Basic Info */}
              <div className="flex gap-10 px-4 py-2 items-center">
                <Link to="/">
                  <FaArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex flex-col">
                  <p className="font-bold text-lg">{user?.fullName}</p>
                  <span className="text-sm text-slate-500">{POSTS?.length} posts</span>
                </div>
              </div>

              {/* COVER IMG */}
              <div className="relative group/cover">
                <img
                  src={coverImg || user?.coverImg || "/cover.png"}
                  className="h-52 w-full object-cover"
                  alt="cover image"
                />

                {/* Edit Cover Icon */}
                {isMyProfile && (
                  <div
                    className="absolute top-2 right-2 rounded-full p-2 bg-gray-800 bg-opacity-75 cursor-pointer opacity-0 group-hover/cover:opacity-100 transition duration-200"
                    onClick={() => coverImgRef.current.click()}
                  >
                    <MdEdit className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* Hidden Inputs */}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  ref={coverImgRef}
                  onChange={(e) => handleImgChange(e, "coverImg")}
                />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  ref={profileImgRef}
                  onChange={(e) => handleImgChange(e, "profileImg")}
                />

                {/* USER AVATAR */}
                <div className="avatar absolute -bottom-16 left-4">
                  <div className="w-32 rounded-full relative group/avatar">
                    <img
                      src={profileImg || user?.profileImg || "/avatar-placeholder.png"}
                      alt="profile avatar"
                    />
                    <div className="absolute top-5 right-3 p-1 bg-primary rounded-full group-hover/avatar:opacity-100 opacity-0 cursor-pointer">
                      {isMyProfile && (
                        <MdEdit
                          className="w-4 h-4 text-white"
                          onClick={() => profileImgRef.current.click()}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Profile / Follow Button */}
              <div className="flex justify-end px-4 mt-5">
                {isMyProfile && <EditProfileModal user={user} coverImg={coverImg} profileImg={profileImg} />} 
                {/* Possibly for editing name, bio, etc. */}
                {!isMyProfile && (
                  <button
                    className="btn btn-outline rounded-full btn-sm"
                    onClick={() => follow(user._id)}
                  >
                    {authUser?.following?.includes(user._id) ? "Unfollow" : "Follow"}
                  </button>
                )}

                {/* The Update button for new images */}
                {(coverImg || profileImg) && (
                  <button
                    className="btn btn-primary rounded-full btn-sm text-white px-4 ml-2"
                    onClick={ handleUpdateProfile}
                  >
                    {(isEditingProfile || isRefetching || isLoading || IsRefetching) ? "Updating..." : "Update"}
                  </button>
                )}
              </div>

              {/* User Info */}
              <div className="flex flex-col gap-4 mt-14 px-4">
                <div className="flex flex-col">
                  <span className="font-bold text-lg">{user?.fullName}</span>
                  <span className="text-sm text-slate-500">@{user?.username}</span>
                  <span className="text-sm my-1">{user?.bio}</span>
				  
                </div>

                {/* Additional Info (Link, Join Date) */}
                <div className="flex gap-2 flex-wrap">
                  {user?.link && (
                    <div className="flex gap-1 items-center">
                      <>
                        <FaLink className="w-3 h-3 text-slate-500" />
                        <a
                        //   href={user?.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          {user.link}
                        </a>
                      </>
                    </div>
                  )}
                  <div className="flex gap-2 items-center">
                    <IoCalendarOutline className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-500">
                      Joined in {Year}
                    </span>
                  </div>
                </div>

                {/* Following / Followers */}
                <div className="flex gap-2">
                  <div className="flex gap-1 items-center">
                    <span className="font-bold text-xs">
                      {user?.following?.length}
                    </span>
                    <span className="text-slate-500 text-xs">Following</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className="font-bold text-xs">
                      {user?.followers?.length}
                    </span>
                    <span className="text-slate-500 text-xs">Followers</span>
                  </div>
                </div>
              </div>

              {/* Feed Tabs (Posts / Likes) */}
              <div className="flex w-full border-b border-gray-700 mt-4">
                <div
                  className="flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 relative cursor-pointer"
                  onClick={() => changeFeedType("posts")}
                >
                  Posts
                  {feedType === "posts" && (
                    <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <div
                  className="flex justify-center flex-1 p-3 text-slate-500 hover:bg-secondary transition duration-300 relative cursor-pointer"
                  onClick={() => changeFeedType("likes")}
                >
                  Likes
                  {feedType === "likes" && (
                    <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Posts Section */}
          {/* Ensure user is defined. If user is undefined, you'll get an error. */}
          {user?._id && (
            <Posts feedType={feedType} username={user.username} userId={user._id} />
          )}
        </div>
      </div>
    </>
  );
};

export default ProfilePage;