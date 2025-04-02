import { useEffect, useState } from "react";
import { auth } from "../../Firestore/firestore";
import { updateProfile } from "firebase/auth";
import { doc, getFirestore, updateDoc } from "firebase/firestore";

const db = getFirestore(); // Initialize Firestore

const Profile = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (auth.currentUser) {
            setName(auth.currentUser.displayName || "");
            setEmail(auth.currentUser.email || "");
        }
    }, []);

    const handleSaveChanges = async () => {
        if (!auth.currentUser) return;

        setLoading(true);
        try {
            // Update Firebase Auth profile
            await updateProfile(auth.currentUser, { displayName: name });

            // Update Firestore if user data is stored there
            const userRef = doc(db, "users", auth.currentUser.uid);

            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        }
        setLoading(false);
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                type="email"
                placeholder="Email (cannot be changed)"
                value={email}
                readOnly
            />
            
            <button onClick={handleSaveChanges} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
            </button>
        </div>
    );
};

export default Profile;
