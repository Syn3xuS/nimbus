type Props = {
	params: Promise<{ username: string }>; // <-- note the Promise
};

async function getUser(username: string) {
	const res = await fetch(`http://localhost:3000/api/users/${username}`, {
		cache: "no-store",
	});

	if (!res.ok) return null;
	return res.json();
}

export default async function page({ params }: Props) {
	const { username } = await params; // <-- unwrap the promise here

	const data = await getUser(username); // now this works

	if (!data) {
		return <h1>User not found</h1>;
	}

	return (
		<div>
			<h1>{data.user.username}</h1>
			<p>Email: {data.user.email}</p>
			<p>Joined: {data.user.createdAt}</p>
		</div>
	);
}
