import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Sidebar from './Sidebar';
import styles from './Dashboard.module.css';
import type { UserSession } from '../../types/UserSession';

const DashboardLayout: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const navigate = useNavigate();

    const userSessionStr = sessionStorage.getItem('userSession');
    const userSession: UserSession = JSON.parse(userSessionStr!);

    if (!userSession || !userSession.token) {
        if (Cookies.get('authToken')) {
            Cookies.remove('authToken');
        }
        sessionStorage.clear();
        navigate('/');
        return null;
    }

    return (
        <div className={styles.container}>
            <Sidebar
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
                userSession={userSession}
            />
            <div className={`${styles.mainContentDesktop} ${isCollapsed ? styles.expanded : ''}`}>
                <div className={styles.header}>
                    <h1>Панель управления</h1>
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            {userSession.name?.charAt(0) || '?'}{userSession.surname?.charAt(0) || '?'}
                        </div>
                        <span>{userSession.role?.name}</span>
                    </div>
                </div>

                <>
                    <div className="dormitory-structure">
                        <div className="search-section">
                            <h3>Поиск по общежитию</h3>
                            <div className="search-filters">
                                <div className="filter-group">
                                    <label className="form-label">Поиск по ФИО студента</label>
                                </div>
                                <div className="filter-group">
                                    <label className="form-label">Этаж</label>
                                    <select className="form-select">
                                        <option>Все этажи</option>
                                        <option>1 этаж</option>
                                        <option>2 этаж</option>
                                        <option>3 этаж</option>
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label className="form-label">Блок</label>
                                    <select className="form-select">
                                        <option>Все блоки</option>
                                        <option>Блок 101</option>
                                        <option>Блок 102</option>
                                        <option>Блок 103</option>
                                        <option>Блок 104</option>
                                        <option>Блок 201</option>
                                        <option>Блок 202</option>
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label className="form-label">Статус заселения</label>
                                    <select className="form-select">
                                        <option>Все статусы</option>
                                        <option>Занят</option>
                                        <option>Свободен</option>
                                        <option>Частично занят</option>
                                    </select>
                                </div>
                            </div>
                            <div className="d-flex justify-content-end">
                                <button className="btn btn-secondary me-2">Сбросить</button>
                                <button className="btn btn-primary">
                                    <i className="bi bi-search me-1"></i>
                                    Найти
                                </button>
                            </div>
                        </div>


                        <div className="floor-section">
                            <div className="floor-header">
                                <h3 className="floor-title">1 этаж</h3>
                                <div className="floor-stats">
                                    <span className="badge bg-primary">12 мест</span>
                                    <span className="badge bg-success">8 свободно</span>
                                </div>
                            </div>

                            <div className="blocks-container">
                                <div className="block-card">
                                    <div className="block-header">
                                        <div className="block-number">Блок 101</div>
                                        <div className="block-status status-occupied">Занят</div>
                                    </div>
                                    <div className="block-type">Мужской, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>4/5</strong></div>
                                    <div className="block-occupants">
                                        Иванов И.И., Петров П.П.,
                                        Сидоров С.С., Волков В.В.
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary" >Подробнее</button>
                                    </div>
                                </div>


                                <div className="block-card">
                                    <div className="block-header">
                                        <div className="block-number">Блок 102</div>
                                        <div className="block-status status-occupied">Занят</div>
                                    </div>
                                    <div className="block-type">Женский, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>2/5</strong></div>
                                    <div className="block-occupants">
                                        Иванова А.А., Петрова Б.Б.
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary" >Подробнее</button>
                                    </div>
                                </div>

                                <div className="block-card" >
                                    <div className="block-header">
                                        <div className="block-number">Блок 103</div>
                                        <div className="block-status status-available-occupied">Доступно 3 места</div>
                                    </div>
                                    <div className="block-type">Мужской, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>2/5</strong></div>
                                    <div className="block-occupants">
                                        Иванов И.И., Петров П.П.
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary" >Подробнее</button>
                                    </div>
                                </div>

                                <div className="block-card" >
                                    <div className="block-header">
                                        <div className="block-number">Блок 104</div>
                                        <div className="block-status status-occupied">Занят</div>
                                    </div>
                                    <div className="block-type">Мужской, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>5/5</strong></div>
                                    <div className="block-occupants">
                                        Зайцев З.З., Медведев М.М.,
                                        Белов Б.Б., Орлов О.О., Павлов П.П.
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary">Подробнее</button>
                                    </div>
                                </div>

                                <div className="block-card" >
                                    <div className="block-header">
                                        <div className="block-number">Блок 105</div>
                                        <div className="block-status status-available">Свободен</div>
                                    </div>
                                    <div className="block-type">Женский, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>0/5</strong></div>
                                    <div className="block-occupants">
                                        Свободен для заселения
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary">Подробнее</button>
                                    </div>
                                </div>

                                <div className="block-card" >
                                    <div className="block-header">
                                        <div className="block-number">Блок 106</div>
                                        <div className="block-status status-available">Свободен</div>
                                    </div>
                                    <div className="block-type">Мужской, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>0/5</strong></div>
                                    <div className="block-occupants">
                                        Свободен для заселения
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary">Подробнее</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="floor-section">
                            <div className="floor-header">
                                <h3 className="floor-title">2 этаж</h3>
                                <div className="floor-stats">
                                    <span className="badge bg-primary">16 мест</span>
                                    <span className="badge bg-success">10 свободно</span>
                                </div>
                            </div>

                            <div className="blocks-container">
                                <div className="block-card" >
                                    <div className="block-header">
                                        <div className="block-number">Блок 201</div>
                                        <div className="block-status status-occupied">Занят</div>
                                    </div>
                                    <div className="block-type">Мужской, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>3/5</strong></div>
                                    <div className="block-occupants">
                                        Новиков Н.Н., Соколов С.С.,
                                        Волков В.В.
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary" >Подробнее</button>
                                    </div>
                                </div>

                                <div className="block-card" >
                                    <div className="block-header">
                                        <div className="block-number">Блок 202</div>
                                        <div className="block-status status-occupied">Занят</div>
                                    </div>
                                    <div className="block-type">Женский, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>4/5</strong></div>
                                    <div className="block-occupants">
                                        Козлова К.К., Морозова М.М.,
                                        Волкова В.В., Зайцева З.З.
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary" >Подробнее</button>
                                    </div>
                                </div>

                                <div className="block-card">
                                    <div className="block-header">
                                        <div className="block-number">Блок 203</div>
                                        <div className="block-status status-available">Свободен</div>
                                    </div>
                                    <div className="block-type">Мужской, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>0/5</strong></div>
                                    <div className="block-occupants">
                                        Свободен для заселения
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary" >Подробнее</button>
                                    </div>
                                </div>

                                <div className="block-card" >
                                    <div className="block-header">
                                        <div className="block-number">Блок 204</div>
                                        <div className="block-status status-available">Свободен</div>
                                    </div>
                                    <div className="block-type">Женский, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>0/5</strong></div>
                                    <div className="block-occupants">
                                        Свободен для заселения
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary" >Подробнее</button>
                                    </div>
                                </div>

                                <div className="block-card" >
                                    <div className="block-header">
                                        <div className="block-number">Блок 205</div>
                                        <div className="block-status status-available-occupied">Доступно 2 места</div>
                                    </div>
                                    <div className="block-type">Мужской, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>3/5</strong></div>
                                    <div className="block-occupants">
                                        Сидоров С.С., Волков В.В., Белов Б.Б.
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary" >Подробнее</button>
                                    </div>
                                </div>

                                <div className="block-card" >
                                    <div className="block-header">
                                        <div className="block-number">Блок 206</div>
                                        <div className="block-status status-available">Свободен</div>
                                    </div>
                                    <div className="block-type">Женский, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>0/5</strong></div>
                                    <div className="block-occupants">
                                        Свободен для заселения
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary" >Подробнее</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="floor-section">
                            <div className="floor-header">
                                <h3 className="floor-title">3 этаж</h3>
                                <div className="floor-stats">
                                    <span className="badge bg-primary">20 мест</span>
                                    <span className="badge bg-success">14 свободно</span>
                                </div>
                            </div>

                            <div className="blocks-container">
                                <div className="block-card">
                                    <div className="block-header">
                                        <div className="block-number">Блок 301</div>
                                        <div className="block-status status-available">Свободен</div>
                                    </div>
                                    <div className="block-type">Женский, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>0/5</strong></div>
                                    <div className="block-occupants">
                                        Свободен для заселения
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary" >Подробнее</button>
                                    </div>
                                </div>

                                <div className="block-card" >
                                    <div className="block-header">
                                        <div className="block-number">Блок 302</div>
                                        <div className="block-status status-available">Свободен</div>
                                    </div>
                                    <div className="block-type">Мужской, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>0/5</strong></div>
                                    <div className="block-occupants">
                                        Свободен для заселения
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary">Подробнее</button>
                                    </div>
                                </div>

                                <div className="block-card" >
                                    <div className="block-header">
                                        <div className="block-number">Блок 303</div>
                                        <div className="block-status status-available">Свободен</div>
                                    </div>
                                    <div className="block-type">Женский, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>0/5</strong></div>
                                    <div className="block-occupants">
                                        Свободен для заселения
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary" >Подробнее</button>
                                    </div>
                                </div>

                                <div className="block-card" >
                                    <div className="block-header">
                                        <div className="block-number">Блок 304</div>
                                        <div className="block-status status-available">Свободен</div>
                                    </div>
                                    <div className="block-type">Мужской, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>0/5</strong></div>
                                    <div className="block-occupants">
                                        Свободен для заселения
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary" >Подробнее</button>
                                    </div>
                                </div>

                                <div className="block-card">
                                    <div className="block-header">
                                        <div className="block-number">Блок 305</div>
                                        <div className="block-status status-available">Свободен</div>
                                    </div>
                                    <div className="block-type">Женский, 5 мест</div>
                                    <div className="block-capacity">Заселено: <strong>0/5</strong></div>
                                    <div className="block-occupants">
                                        Свободен для заселения
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn primary">Подробнее</button>
                                    </div>
                                </div>

                                <div className="block-header">
                                    <div className="block-number">Блок 306</div>
                                    <div className="block-status status-available">Свободен</div>
                                </div>
                                <div className="block-type">Мужской, 5 мест</div>
                                <div className="block-capacity">Заселено: <strong>0/5</strong></div>
                                <div className="block-occupants">
                                    Свободен для заселения
                                </div>
                                <div className="action-buttons">
                                    <button className="action-btn primary" >Подробнее</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            </div>
        </div>
    );
};

export default DashboardLayout;