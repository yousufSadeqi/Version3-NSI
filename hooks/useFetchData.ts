import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, QueryConstraint } from 'firebase/firestore';
import { firestore } from '@/config/firebase';

const useFetchData = <T>(collectionName: string, constraints: QueryConstraint[] = []) => {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!collectionName) return;

        const collectionRef = collection(firestore, collectionName);
        const q = query(collectionRef, ...constraints);

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as T[];

                setData(fetchData);
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                console.log(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [collectionName, constraints]);

    return { data, loading, error };
};

export default useFetchData;
