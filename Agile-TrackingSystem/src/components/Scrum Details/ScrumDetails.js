import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../context/UserContext';
import { useHistory } from 'react-router-dom';
import "./ScrumDetails.css";

const ScrumDetails = ({ scrum }) => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [editedScrum, setEditedScrum] = useState({ ...scrum });
    const { user } = useContext(UserContext);
    const history = useHistory();

    useEffect(() => {
        const checkUser = () => {
            const loggedInUser = JSON.parse(localStorage.getItem('user'));
            if (!loggedInUser) {
                history.push('/login');
            }
        };
        checkUser();
    }, [history]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await axios.get(`http://localhost:4000/tasks?scrumId=${scrum.id}`);
                setTasks(response.data);
            } catch (error) {
                console.error('Error fetching tasks:', error);
            }
        };

        fetchTasks();
    }, [scrum.id]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:4000/users');
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await axios.patch(`http://localhost:4000/tasks/${taskId}`, {
                status: newStatus,
                history: [
                    ...tasks.find(task => task.id === taskId).history,
                    {
                        status: newStatus,
                        date: new Date().toISOString().split('T')[0],
                    },
                ],
            });

            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === taskId ? { ...task, status: newStatus } : task
                )
            );
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    };

    const handleEditScrum = () => {
        setEditMode(true);
    };

    const handleSaveScrum = async () => {
        try {
            await axios.patch(`http://localhost:4000/scrums/${scrum.id}`, editedScrum);
            setEditMode(false);
        } catch (error) {
            console.error('Error updating scrum:', error);
        }
    };

    const handleCancelEdit = () => {
        setEditedScrum({ ...scrum });
        setEditMode(false);
    };

    // const handleUserAssignment = async (taskId, userId) => {
    //     try {
    //         await axios.patch(`http://localhost:4000/tasks/${taskId}`, {
    //             assignedTo: userId,
    //         });

    //         setTasks(prevTasks =>
    //             prevTasks.map(task =>
    //                 task.id === taskId ? { ...task, assignedTo: userId } : task
    //             )
    //         );
    //     } catch (error) {
    //         console.error('Error assigning user:', error);
    //     }
    // };
   

    return (
        <div className="scrum-details-container">
            <div className="scrum-header">
                {editMode ? (
                    <div className="edit-scrum-form">
                        <input
                            type="text"
                            value={editedScrum.name}
                            onChange={(e) => {
                                setEditedScrum({ ...editedScrum, name: e.target.value })
                            }}
                            className="edit-scrum-input"
                        />
                        <div className="edit-buttons">
                            <button onClick={async () => {
                                await handleSaveScrum()
                                window.location.reload()
                            }} className="save-button">Save</button>
                            <button onClick={handleCancelEdit} className="cancel-button">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h3>Scrum Details for {editMode ? editedScrum.name : scrum.name}</h3>
                        {user?.role === 'admin' && (
                            <button onClick={handleEditScrum} className="edit-button">Edit Scrum</button>
                        )}
                    </>
                )}
            </div>

            <div className="scrum-content">
                <div className="tasks-section">
                    <h4>Tasks</h4>
                    <ul className="tasks-list">
                        {tasks.map(task => {
                            const assignedUser = users.find(user => user.id === parseInt(task.assignedTo));
                            return (
                                <li key={task.id} className="task-item">
                                    <div className="task-info">
                                        <strong>{task.title}:</strong>
                                        <p>{task.description}</p>
                                        <span className={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>
                                            {task.status}
                                        </span>
                                        <div className="assigned-user">
                                            <label>Assigned to: </label>
                                            <span>{assignedUser ? `${assignedUser.name} (${assignedUser.email})` : 'Unassigned'}</span>
                                        </div>
                                    </div>

                                    {user?.role === 'admin' && (
                                        <select
                                            className="status-select"
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                        >
                                            <option value="To Do">To Do</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Done">Done</option>
                                        </select>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="users-section">
                    <h4>Users</h4>
                    <ul>
                    {tasks.map(task => {
                    const assignedUser = users.find(user => user.id === parseInt(task.assignedTo))
                    return (
                        <li key={task.id}>
                            {assignedUser ? assignedUser.name : 'Unassigned'} ({assignedUser ? assignedUser.email : 'N/A'})
                        </li>
                    )
                })}
            </ul>
                </div>
            </div>
        </div>
    );
};

export default ScrumDetails;
