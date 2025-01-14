import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useFollow = () => {
	const queryClient = useQueryClient();
    const {data:authUser} = useQuery({queryKey:["authUser"]})
    console.log("From Hook",authUser)
	const { mutate: follow, isPending } = useMutation({
		mutationFn: async (userId) => {
			try {
				const res = await fetch(`/api/user/follow/${userId}`, {
					method: "POST",
				});

				const data = await res.json();
				if (!res.ok) {
					console.log("res", data.error || "something went wrong")
                    throw new Error(data.error || "Something went wrong!");
				
                }
				return userId
			} catch (error) {
				console.log("catch" ,error)
                throw new Error(error.message);
			}
		},
		onSuccess: (userId) => {
			Promise.all([
				queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] }),
				queryClient.invalidateQueries({ queryKey: ["authUser"] }),
                queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
			]);
            if(authUser.following.includes(userId))
            {
                toast.success("User unfollowed successfully ");
            }
            else {
                toast.success("User followed successfully ");
            }
           
		},
		onError: (error) => {
			console.log("toast" ,error)
            toast.error(error.message);
		},
	});

	return { follow, isPending };
};

export default useFollow;