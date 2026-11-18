import { useAuth } from "../../context/AuthContext";

const UserDropdown = () => {
    const { user } = useAuth();

    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                {user?.fullName?.charAt(0)}
            </div>

            <div>
                <p className="font-semibold">
                    {user?.fullName}
                </p>

                <p className="text-sm text-gray-500">
                    {user?.email}
                </p>
            </div>
        </div>
    );
};

export default UserDropdown;