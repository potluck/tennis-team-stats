async function updateTeamName() {
  try {
    const response = await fetch('http://localhost:3000/api/update-team-name', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamId: 1,
        name: 'Manhattan 2025 4.0 Women - Tang/Kelly'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Team name updated successfully:', data);
  } catch (error) {
    console.error('Failed to update team name:', error);
  }
}

updateTeamName(); 