# 全面测试文档

这是一个全面的测试文档，用于验证内容分割功能是否正常工作，涵盖用户提到的所有问题场景。

## 1. 短代码块测试

```shell
echo "Hello, World!"
```

## 2. 长代码块测试（核心问题）

```javascript
// 这是一个非常长的JavaScript代码块
// 用于测试代码块分割功能
class ComprehensiveCalculator {
    constructor() {
        this.result = 0;
        this.history = [];
    }

    // 基本运算
    add(...numbers) {
        const sum = numbers.reduce((acc, num) => acc + num, 0);
        this.history.push({ operation: 'add', numbers, result: this.result + sum });
        this.result += sum;
        return this;
    }

    subtract(...numbers) {
        const difference = numbers.reduce((acc, num) => acc - num, 0);
        this.history.push({ operation: 'subtract', numbers, result: this.result + difference });
        this.result += difference;
        return this;
    }

    multiply(...numbers) {
        const product = numbers.reduce((acc, num) => acc * num, 1);
        this.history.push({ operation: 'multiply', numbers, result: this.result * product });
        this.result *= product;
        return this;
    }

    divide(...numbers) {
        const quotient = numbers.reduce((acc, num) => {
            if (num === 0) throw new Error("除数不能为零");
            return acc / num;
        }, 1);
        this.history.push({ operation: 'divide', numbers, result: this.result / quotient });
        this.result /= quotient;
        return this;
    }

    // 高级运算
    power(exponent) {
        const result = Math.pow(this.result, exponent);
        this.history.push({ operation: 'power', exponent, result });
        this.result = result;
        return this;
    }

    squareRoot() {
        if (this.result < 0) throw new Error("不能对负数取平方根");
        const result = Math.sqrt(this.result);
        this.history.push({ operation: 'squareRoot', result });
        this.result = result;
        return this;
    }

    // 三角函数
    sin() {
        const result = Math.sin(this.result);
        this.history.push({ operation: 'sin', result });
        this.result = result;
        return this;
    }

    cos() {
        const result = Math.cos(this.result);
        this.history.push({ operation: 'cos', result });
        this.result = result;
        return this;
    }

    tan() {
        const result = Math.tan(this.result);
        this.history.push({ operation: 'tan', result });
        this.result = result;
        return this;
    }

    // 历史记录
    getHistory() {
        return [...this.history];
    }

    clearHistory() {
        this.history = [];
        return this;
    }

    // 重置
    reset() {
        this.result = 0;
        return this;
    }

    getResult() {
        return this.result;
    }
}

// 使用示例
const calc = new ComprehensiveCalculator();
const result1 = calc.add(5, 10).subtract(3).multiply(2).getResult();
console.log(`结果1: ${result1}`); // 应该是24

calc.reset();
const result2 = calc.add(100).divide(2).subtract(20).multiply(3).getResult();
console.log(`结果2: ${result2}`); // 应该是90

// 测试高级功能
calc.reset();
const result3 = calc.add(9).squareRoot().power(2).getResult();
console.log(`结果3: ${result3}`); // 应该是9

// 测试三角函数
calc.reset();
calc.add(Math.PI / 2); // 90度
const result4 = calc.sin().getResult();
console.log(`sin(90°): ${result4}`); // 应该接近1

// 测试历史记录
console.log("操作历史:", calc.getHistory());

// 异步函数示例
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("获取数据失败:", error);
        throw error;
    }
}

// 复杂数组操作
function processData(data) {
    return data
        .filter(item => item.active)
        .map(item => ({
            ...item,
            processed: true,
            timestamp: new Date().toISOString()
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});
}

// 生成大量数据
function generateLargeDataset(size) {
    const data = [];
    for (let i = 0; i < size; i++) {
        data.push({
            id: i + 1,
            name: `Item ${i + 1}`,
            category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
            value: Math.random() * 1000,
            active: Math.random() > 0.3,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return data;
}

// 测试大数据集处理
const largeData = generateLargeDataset(100);
const processedData = processData(largeData);
console.log("处理后的数据:", processedData);

console.log("JavaScript代码块结束");
```

## 3. 项目列表测试

- 项目1：完成基础功能实现
  - 子项目1.1：设置项目结构
  - 子项目1.2：实现核心算法
  - 子项目1.3：添加基本UI组件
- 项目2：优化性能
  - 子项目2.1：代码优化
  - 子项目2.2：算法优化
  - 子项目2.3：UI渲染优化
- 项目3：添加新功能
  - 子项目3.1：用户认证
  - 子项目3.2：数据可视化
  - 子项目3.3：导出功能
- 项目4：修复已知问题
  - 子项目4.1：代码块分割问题
  - 子项目4.2：列表项显示问题
  - 子项目4.3：文本截断问题
- 项目5：文档完善
  - 子项目5.1：API文档
  - 子项目5.2：用户手册
  - 子项目5.3：测试文档
- 项目6：部署上线
  - 子项目6.1：服务器配置
  - 子项目6.2：数据库设置
  - 子项目6.3：域名配置
- 项目7：监控维护
  - 子项目7.1：错误监控
  - 子项目7.2：性能监控
  - 子项目7.3：定期维护
- 项目8：用户反馈处理
  - 子项目8.1：收集反馈
  - 子项目8.2：分析反馈
  - 子项目8.3：修复问题
- 项目9：功能扩展
  - 子项目9.1：新特性开发
  - 子项目9.2：第三方集成
  - 子项目9.3：API扩展
- 项目10：安全加固
  - 子项目10.1：漏洞修复
  - 子项目10.2：权限管理
  - 子项目10.3：数据加密

## 4. 混合内容测试

这是一段正常的文本内容，用于测试混合内容的分割效果。

下面是一个长代码块：

```python
# 这是一个混合内容中的长Python代码块
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score

# 生成复杂数据集
def generate_complex_data(n_samples=2000):
    np.random.seed(42)
    X1 = np.random.normal(0, 1, n_samples)
    X2 = np.random.normal(0, 2, n_samples)
    X3 = np.random.normal(0, 0.5, n_samples)
    
    # 非线性关系
    y = (3 * X1 ** 2) + (2 * X2) + (5 * X3) + np.random.normal(0, 1, n_samples)
    
    # 创建DataFrame
    df = pd.DataFrame({
        'X1': X1,
        'X2': X2,
        'X3': X3,
        'y': y
    })
    
    return df

# 数据预处理函数
def preprocess_data(df):
    # 分离特征和目标变量
    X = df[['X1', 'X2', 'X3']]
    y = df['y']
    
    # 分割训练集和测试集
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    return X_train, X_test, y_train, y_test

# 训练和评估模型
def train_and_evaluate(X_train, X_test, y_train, y_test):
    models = {
        'Linear Regression': LinearRegression(),
        'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42)
    }
    
    results = {}
    
    for name, model in models.items():
        # 训练模型
        model.fit(X_train, y_train)
        
        # 预测
        y_pred = model.predict(X_test)
        
        # 评估
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        results[name] = {
            'model': model,
            'mse': mse,
            'r2': r2,
            'predictions': y_pred
        }
        
        print(f"{name}: MSE = {mse:.2f}, R² = {r2:.2f}")
    
    return results

# 可视化结果
def visualize_results(y_test, results):
    plt.figure(figsize=(12, 6))
    
    # 绘制实际值
    plt.scatter(range(len(y_test)), y_test, color='blue', alpha=0.5, label='实际值')
    
    # 绘制预测值
    for name, result in results.items():
        plt.plot(range(len(y_test)), result['predictions'], label=f'{name} 预测值')
    
    plt.xlabel('样本索引')
    plt.ylabel('目标变量')
    plt.title('模型预测结果对比')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()

# 特征重要性分析
def analyze_feature_importance(results, feature_names):
    if 'Random Forest' in results:
        rf_model = results['Random Forest']['model']
        importances = rf_model.feature_importances_
        
        plt.figure(figsize=(8, 6))
        plt.bar(range(len(importances)), importances, tick_label=feature_names)
        plt.xlabel('特征')
        plt.ylabel('重要性')
        plt.title('随机森林特征重要性')
        plt.tight_layout()
        plt.show()

# 主函数
def main():
    print("生成数据...")
    df = generate_complex_data()
    
    print("数据基本信息:")
    print(df.head())
    print(df.describe())
    
    print("预处理数据...")
    X_train, X_test, y_train, y_test = preprocess_data(df)
    
    print("训练和评估模型...")
    results = train_and_evaluate(X_train, X_test, y_train, y_test)
    
    print("可视化结果...")
    visualize_results(y_test, results)
    
    print("分析特征重要性...")
    analyze_feature_importance(results, ['X1', 'X2', 'X3'])

if __name__ == "__main__":
    main()
```

这是代码块后面的文本内容，用于测试混合内容的分割效果。

## 5. 多段连续代码块测试

```shell
echo "第一段代码块"
ls -la
echo "第一段代码块结束"
```

```python
print("第二段代码块")
x = 10
y = 20
print(f"x + y = {x + y}")
print("第二段代码块结束")
```

```java
// 第三段代码块
public class Test {
    public static void main(String[] args) {
        System.out.println("第三段代码块");
        int x = 10;
        int y = 20;
        System.out.println("x + y = " + (x + y));
        System.out.println("第三段代码块结束");
    }
}
```

## 6. 包含特殊字符的代码块

```shell
echo "包含特殊字符的代码块"
echo "引号: \"Hello\" and \'World\'"
echo "转义字符: \\n \\t \\r"
echo "特殊符号: !@#$%^&*()_+-=[]{}|;:,.<>?/"
echo "多行文本:\nLine 1\nLine 2\nLine 3"
echo "变量: $HOME $PATH $USER"
echo "命令替换: $(date)"
echo "包含特殊字符的代码块结束"
```

## 7. 长文本段落测试

这是一段非常长的文本段落，用于测试文本内容的分割效果。这段文本应该足够长，能够跨越多个页面，以验证内容分割功能是否正常工作。文本内容会持续添加，直到达到足够的长度。这段文本包含了各种标点符号、空格和换行符，模拟真实的文本内容。这段文本的目的是测试内容分割算法是否能够正确处理长文本段落，确保文本不会被截断，并且能够在页面之间正确换行。继续添加更多的文本内容，确保文本足够长，能够跨越多个页面。这段文本的长度应该超过单个页面的容量，以触发内容分割功能。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。继续添加文本内容，确保文本足够长，能够触发内容分割。这段文本应该包含足够的字符，以确保能够跨越多个页面。继续添加文本内容，直到达到测试所需的长度。这段文本的内容是随机的，主要用于测试内容分割功能，没有实际的意义。

## 8. 混合格式测试

### 8.1 标题和列表混合

#### 8.1.1 小标题

- 列表项1
- 列表项2
- 列表项3

#### 8.1.2 另一个小标题

1. 有序列表项1
2. 有序列表项2
3. 有序列表项3

### 8.2 代码块和文本混合

这是一段文本，下面是一个代码块：

```python
print("Hello from code block")
```

这是代码块后面的文本。

### 8.3 强调文本测试

这是**粗体文本**，这是*斜体文本*，这是***加粗斜体文本***。

### 8.4 链接测试

[这是一个链接](https://example.com)，这是一个[带标题的链接](https://example.com "示例网站")。

## 9. 特殊元素测试

### 9.1 表格测试

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 行1 | 数据1 | 数据2 |
| 行2 | 数据3 | 数据4 |
| 行3 | 数据5 | 数据6 |

### 9.2 引用测试

> 这是一个引用块
> 包含多行文本
> 用于测试引用块的分割

### 9.3 分割线测试

---

这是分割线后面的文本。

## 10. 页脚默认字段测试

作者名称 作者账号 个人简介

这是文档的最后部分，用于测试页脚默认字段的显示效果。