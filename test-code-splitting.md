# 测试代码块分割

这是一个测试文档，用于验证代码块分割功能是否正常工作。

## 短代码块

```shell
#!/bin/bash
echo "Hello, World!"
```

## 长代码块

```shell
#!/bin/bash

# 这是一个长脚本示例
# 用于测试代码块分割功能

function setup_environment() {
    echo "正在设置环境..."
    export PATH=$PATH:/usr/local/bin
    export PYTHONPATH=/home/user/python_libs
    echo "环境设置完成"
}

function install_dependencies() {
    echo "正在安装依赖..."
    pip install requests beautifulsoup4 pandas numpy matplotlib
    pip install scikit-learn tensorflow pytorch
    echo "依赖安装完成"
}

function run_tests() {
    echo "正在运行测试..."
    pytest -v tests/
    echo "测试完成"
}

function deploy() {
    echo "正在部署应用..."
    docker build -t myapp:latest .
    docker run -d -p 8080:80 myapp:latest
    echo "应用部署完成"
}

# 主程序
if [ "$1" = "setup" ]; then
    setup_environment
elif [ "$1" = "install" ]; then
    install_dependencies
elif [ "$1" = "test" ]; then
    run_tests
elif [ "$1" = "deploy" ]; then
    deploy
else
    echo "用法: $0 {setup|install|test|deploy}"
fi

# 脚本结束
```

## 另一个长代码块

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

# 生成示例数据
def generate_data(n_samples=1000):
    np.random.seed(42)
    X = np.linspace(0, 10, n_samples)
    y = 2 * X + 5 + np.random.normal(0, 2, n_samples)
    return X, y

# 数据预处理
def preprocess_data(X, y):
    # 将X转换为二维数组
    X = X.reshape(-1, 1)
    # 分割训练集和测试集
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    return X_train, X_test, y_train, y_test

# 训练模型
def train_model(X_train, y_train):
    model = LinearRegression()
    model.fit(X_train, y_train)
    return model

# 评估模型
def evaluate_model(model, X_test, y_test):
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    return mse, r2

# 可视化结果
def visualize_results(X, y, model):
    plt.figure(figsize=(10, 6))
    plt.scatter(X, y, color='blue', alpha=0.5, label='实际数据')
    plt.plot(X, model.predict(X.reshape(-1, 1)), color='red', linewidth=2, label='预测线')
    plt.xlabel('X')
    plt.ylabel('y')
    plt.title('线性回归模型')
    plt.legend()
    plt.grid(True)
    plt.show()

# 主函数
def main():
    print("生成数据...")
    X, y = generate_data()
    
    print("预处理数据...")
    X_train, X_test, y_train, y_test = preprocess_data(X, y)
    
    print("训练模型...")
    model = train_model(X_train, y_train)
    
    print("评估模型...")
    mse, r2 = evaluate_model(model, X_test, y_test)
    print(f"均方误差: {mse:.2f}")
    print(f"R²得分: {r2:.2f}")
    
    print("可视化结果...")
    visualize_results(X, y, model)

if __name__ == "__main__":
    main()
```

## 列表测试

- 列表项1
- 列表项2
- 列表项3
- 列表项4
- 列表项5
- 列表项6
- 列表项7
- 列表项8
- 列表项9
- 列表项10
- 列表项11
- 列表项12
- 列表项13
- 列表项14
- 列表项15
- 列表项16
- 列表项17
- 列表项18
- 列表项19
- 列表项20

## 混合内容测试

这是一段文本，下面是一个长代码块：

```javascript
// 这是一个JavaScript示例
// 用于测试代码块分割功能

class Calculator {
    constructor() {
        this.result = 0;
    }

    add(...numbers) {
        this.result += numbers.reduce((sum, num) => sum + num, 0);
        return this;
    }

    subtract(...numbers) {
        this.result -= numbers.reduce((sum, num) => sum + num, 0);
        return this;
    }

    multiply(...numbers) {
        this.result *= numbers.reduce((product, num) => product * num, 1);
        return this;
    }

    divide(...numbers) {
        if (numbers.includes(0)) {
            throw new Error("除数不能为零");
        }
        this.result /= numbers.reduce((product, num) => product * num, 1);
        return this;
    }

    reset() {
        this.result = 0;
        return this;
    }

    getResult() {
        return this.result;
    }
}

// 使用示例
const calc = new Calculator();
const result1 = calc.add(5, 10).subtract(3).multiply(2).getResult();
console.log(`结果1: ${result1}`); // 应该是24

calc.reset();
const result2 = calc.add(100).divide(2).subtract(20).multiply(3).getResult();
console.log(`结果2: ${result2}`); // 应该是90

// 另一个示例
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// 计算前20个斐波那契数
for (let i = 0; i < 20; i++) {
    console.log(`斐波那契数(${i}): ${fibonacci(i)}`);
}

// 异步函数示例
async function fetchData(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("获取数据失败:", error);
        throw error;
    }
}

// 使用fetchData
alert("JavaScript示例结束");
```

这是代码块后面的文本，用于测试混合内容的分割。