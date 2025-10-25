/**
 * API管理器 - 处理与后端的所有通信
 * 支持简化的认证系统（只需真名）
 */

class APIManager {
    constructor() {
        this.baseURL = 'http://localhost:8000/api';
        this.token = localStorage.getItem('authToken');
        this.currentUser = null;
        
        // 如果有token，尝试加载用户信息
        if (this.token) {
            this.loadUserProfile();
        }
        
        console.log('APIManager: 初始化完成');
    }

    // 设置认证token
    setAuthToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
        console.log('APIManager: 认证token已设置');
    }

    // 清除认证token
    clearAuthToken() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        console.log('APIManager: 认证token已清除');
    }

    // 获取请求头
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            console.log(`APIManager: 请求 ${options.method || 'GET'} ${url}`);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`APIManager: 请求成功`, data);
            return data;
            
        } catch (error) {
            console.error(`APIManager: 请求失败 ${url}`, error);
            throw error;
        }
    }

    // 简化认证：只需真名
    async simpleAuth(realName) {
        try {
            const data = await this.request('/users/simple-auth/', {
                method: 'POST',
                body: JSON.stringify({ real_name: realName })
            });

            // 保存认证信息
            this.setAuthToken(data.access_token);
            this.currentUser = data.user;

            console.log('APIManager: 认证成功', {
                isNewUser: data.is_new_user,
                user: data.user,
                message: data.message
            });

            return {
                success: true,
                isNewUser: data.is_new_user,
                user: data.user,
                message: data.message
            };

        } catch (error) {
            console.error('APIManager: 认证失败', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 加载用户资料
    async loadUserProfile() {
        try {
            const data = await this.request('/users/me/');
            this.currentUser = data;
            console.log('APIManager: 用户资料加载成功', data);
            return data;
        } catch (error) {
            console.error('APIManager: 用户资料加载失败', error);
            this.clearAuthToken();
            return null;
        }
    }

    // 获取题目列表
    async getQuestions(filters = {}) {
        try {
            let endpoint = '/questions/';
            const params = new URLSearchParams();

            if (filters.difficulty) {
                params.append('difficulty', filters.difficulty);
            }
            if (filters.category) {
                params.append('category', filters.category);
            }

            if (params.toString()) {
                endpoint += `?${params.toString()}`;
            }

            console.log('APIManager: 请求题目', endpoint, '筛选条件:', filters);
            const data = await this.request(endpoint);
            console.log('APIManager: 题目获取成功', data);
            console.log('APIManager: 数据类型', typeof data, '是否为数组', Array.isArray(data));

            return data;

        } catch (error) {
            console.error('APIManager: 题目获取失败', error);
            throw error;
        }
    }

    // 获取随机题目
    async getRandomQuestion(filters = {}) {
        try {
            // 先尝试带筛选条件的请求
            let questions = await this.getQuestions(filters);
            console.log('APIManager: 题目API响应结构', questions);

            // 处理不同的响应格式
            let questionList = [];
            if (Array.isArray(questions)) {
                questionList = questions;
            } else if (questions.results && Array.isArray(questions.results)) {
                questionList = questions.results;
            } else if (questions.data && Array.isArray(questions.data)) {
                questionList = questions.data;
            }

            console.log('APIManager: 解析后的题目列表', questionList);

            // 如果筛选后没有结果，尝试获取所有题目
            if (questionList.length === 0) {
                console.log('APIManager: 筛选条件无结果，尝试获取所有题目');
                questions = await this.getQuestions({});

                if (Array.isArray(questions)) {
                    questionList = questions;
                } else if (questions.results && Array.isArray(questions.results)) {
                    questionList = questions.results;
                } else if (questions.data && Array.isArray(questions.data)) {
                    questionList = questions.data;
                }

                console.log('APIManager: 所有题目列表', questionList);

                // 在客户端进行筛选
                if (filters.difficulty || filters.category) {
                    questionList = questionList.filter(q => {
                        let match = true;
                        if (filters.difficulty && q.difficulty !== filters.difficulty) {
                            match = false;
                        }
                        if (filters.category && q.category !== filters.category) {
                            match = false;
                        }
                        return match;
                    });
                    console.log('APIManager: 客户端筛选后的题目', questionList);
                }
            }

            if (questionList.length > 0) {
                const randomIndex = Math.floor(Math.random() * questionList.length);
                const selectedQuestion = questionList[randomIndex];
                console.log('APIManager: 选中的题目', selectedQuestion);
                return selectedQuestion;
            } else {
                throw new Error(`没有找到符合条件的题目。筛选条件: ${JSON.stringify(filters)}`);
            }
        } catch (error) {
            console.error('APIManager: 随机题目获取失败', error);
            throw error;
        }
    }

    // 提交游戏记录
    async submitGameRecord(gameData) {
        try {
            const data = await this.request('/games/records/', {
                method: 'POST',
                body: JSON.stringify(gameData)
            });

            console.log('APIManager: 游戏记录提交成功', data);
            return data;

        } catch (error) {
            console.error('APIManager: 游戏记录提交失败', error);
            throw error;
        }
    }

    // 获取游戏记录
    async getGameRecords() {
        try {
            const data = await this.request('/games/records/');
            console.log('APIManager: 游戏记录获取成功', data);
            return data;
        } catch (error) {
            console.error('APIManager: 游戏记录获取失败', error);
            throw error;
        }
    }

    // 检查是否已认证
    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    }

    // 测试API连接
    async testConnection() {
        try {
            const response = await fetch(`${this.baseURL}/users/simple-auth/`, {
                method: 'OPTIONS'
            });
            console.log('APIManager: API连接测试成功');
            return true;
        } catch (error) {
            console.error('APIManager: API连接测试失败', error);
            return false;
        }
    }

    // 测试认证状态和题目获取
    async testQuestionAccess() {
        console.log('APIManager: 测试题目访问权限');
        console.log('当前认证状态:', this.isAuthenticated());
        console.log('当前token:', this.token ? '已设置' : '未设置');
        console.log('当前用户:', this.currentUser);

        try {
            // 测试简单的题目获取
            const response = await fetch(`${this.baseURL}/questions/`, {
                headers: this.getHeaders()
            });

            console.log('题目API响应状态:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('题目API响应数据:', data);
                return data;
            } else {
                const errorText = await response.text();
                console.error('题目API错误响应:', errorText);
                return null;
            }
        } catch (error) {
            console.error('题目API访问失败:', error);
            return null;
        }
    }
}

// 创建全局API管理器实例
window.apiManager = new APIManager();
