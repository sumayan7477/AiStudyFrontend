import { useEffect, useState } from "react";
import api from "../../api/axios";

const Dashboard = () => {
    const [dashboard, setDashboard] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await api.get("/dashboard");
            setDashboard(response.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <h2>Loading...</h2>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">
                Dashboard
            </h1>

            <pre>
                {JSON.stringify(dashboard, null, 2)}
            </pre>
        </div>
    );
};

export default Dashboard;