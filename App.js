import React, { Component } from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { useState, useEffect, } from "react"; 
import * as SQLite from "expo-sqlite";
import * as SplashScreen from 'expo-splash-screen';

// const heightKey = '@MyApp:key1';
// const weightKey = '@MyApp:key2';
// const resultsKey = '@MyApp:key3';

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("bmiDB.db");
  return db;
}

const db = openDatabase();

function Items() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select * from items`,
        (_, { rows: { _array } }) => setItems(_array)
      );
    });
  }, []);

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.BMI}>BMI History</Text>
      {items.map(({ id, date, bmi, weight, height }) => (
        <Text style={styles.preview}>{date}: {bmi} (W:{weight}, H:{height})</Text>
      ))}
    </View>
  );
}


export default class App extends Component {
  state = {
    results: '',
    weight: '',
    height: '',
    danger: '',
    storeValueString: '',
  };

  constructor(props) {
    super(props);
    this.onLoad();
  }

  onLoad = async () => {
    // try {
    //   const weight = await AsyncStorage.getItem(weightKey);
    //   const results = await AsyncStorage.getItem(resultsKey);
    //   const height = await AsyncStorage.getItem(heightKey);
    //   this.setState({ weight });
    //   this.setState({ height });
    //   this.setState({ results });
    // } catch (error) {
    //   Alert.alert('Error', 'There was an error loading your data');
    // }
    
    db.transaction((tx) => {
       tx.executeSql(
         "drop table items;"
       );
      tx.executeSql(
        "create table if not exists items (id integer primary key not null, date date, bmi number, height text, weight text);"
      );
    });
  }

  onSave = async () => {

    // try {
    //   await AsyncStorage.setItem(weightKey, this.state.weight);
    //   await AsyncStorage.setItem(heightKey, this.state.height);
    //   await AsyncStorage.setItem(resultsKey, this.state.results);
    //   Alert.alert('Saved', 'Successfully saved on device');
    // } catch (error) {
    //   Alert.alert('Error', 'There was an error saving your data');
    //   console.log(error)
    // }

    const { weight, height} = this.state;
    let storedValue = parseFloat(((weight / ( height * height ) ) * 703).toFixed(1));
    let healthCondition
    if (storedValue <= 18.5) {
      healthCondition = "Underweight"
    } else if (storedValue > 18.5 && storedValue < 24.9) {
      healthCondition = "Healthy"
    }else if (storedValue > 25.0 && storedValue < 29.9) {
      healthCondition = "Overweight"
    }else if (storedValue > 30.0) {
      healthCondition = "Obese"
    }
    let storeValueString = "Body Mass Index is " + storedValue + "("+healthCondition+")"

    this.setState({storeValueString})

    db.transaction(
      (tx) => {
        tx.executeSql("insert into items (bmi, height, weight) values (0, date('now'), ?, ?, ?)", [storedValue, height, weight]);
        tx.executeSql(`select * order by date desc;`, [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      }
    );
  }

  onWtChange = (weight) => {
    this.setState({ weight });
  };
  onHtChange = (height) => { 
    this.setState({ height });
  };
  onCalculate = async () => {
    this.setState({ results: 'Loading, please wait...' });
    if (isNaN(this.state.weight)) {
      const results = 'Weight must be a number.';
      const danger = true;
      this.setState({ danger })
      this.setState({ results });
      this.weightText.focus();      
    } else if (('' === this.state.weight) ) {
      const results = 'Please enter a weight.';
      const danger = true;
      this.setState({ danger })
      this.setState({ results });
      this.weightText.focus();
    } else if (isNaN(this.state.height)) {
      const results = 'Height must be a number.';
      const danger = true;
      this.setState({ danger })
      this.setState({ results });
      this.heightText.focus();      
    } else if (('' === this.state.height) ) {
      const results = 'Please enter a height.';
      const danger = true;
      this.setState({ danger })
      this.setState({ results });
      this.heightText.focus();
    } else {
      this.onSave();
      const danger = false;
      this.setState({ danger })
      const results = 'Body Mass Index is ' + ((this.state.weight/(this.state.height*this.state.height))*703).toFixed(1);
      this.setState({ results });
    }
  };  

  render() {

    SplashScreen.preventAutoHideAsync();
    setTimeout(SplashScreen.hideAsync, 2000);

    const { storeValueString, weight, height, danger, results } = this.state;

    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.toolbar}>BMI Calculator</Text>
        <ScrollView style={styles.content}>
          <TextInput
            ref={(input => { this.weightText = input;})}
            style={styles.input}
            onChangeText={this.onWtChange}
            value={weight}
            placeholder="Weight in Pounds"
          />
          <TextInput
            ref={(input => { this.heightText = input;})}
            style={styles.input}
            onChangeText={this.onHtChange}
            value={height}
            placeholder="Height in Inches"
          />
          <TouchableOpacity onPress={this.onCalculate} style={styles.button}>
            <Text style={styles.buttonText}>Compute BMI</Text>
          </TouchableOpacity>
          <Text style={styles.BMI}>{storeValueString}</Text>
          <Items></Items>
          {danger?<TextInput
            style={styles.previewDanger}
            value={results}
            placeholder=" "
            editable={false}
            multiline
          />:
          <TextInput
            style={styles.preview}
            value={results}
            placeholder=" "
            editable={false}
            multiline
          />
          }
          <Text style={styles.text}>
            Assessing Your BMI{"\n"}
            {"\t"}{"\t"}{"\t"}Underweight: less than 18.5{"\n"}
            {"\t"}{"\t"}{"\t"}Healthy: 18.5 to 24.9{"\n"}
            {"\t"}{"\t"}{"\t"}Overweight: 25.0 to 29.9{"\n"}
            {"\t"}{"\t"}{"\t"}Obese: 30.0 or higher{"\n"}
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    backgroundColor: '#f4511e',
    color: '#fff',
    textAlign: 'center',
    padding: 25,
    fontSize: 28 ,
    fontWeight: 'bold'
  },
  content: {
    fontSize:24,
    flex: 1,
    padding: 10,
  },
  BMI: {
    backgroundColor: '#fff',
    textAlign: 'center',
    flex: 1,
    justifyContent: 'center',
    height: 100,
    fontSize: 28
  },
  preview: {
    backgroundColor: '#fff',
    flex: 1,
    height: 100,
    fontSize: 20
  },
  input: {
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    height: 40,
    padding: 5,
    marginBottom: 10,
    fontSize:20,
  },
  button: {
    backgroundColor: '#34495e',
    color: '#fff',
    padding: 10,
    borderRadius: 3,
    marginBottom: 30,
    fontSize: 24
  },
  buttonText: {
    color: '#fff',
    fontSize:20,
    textAlign: 'center',
  },
  text: {
    color: '#000',
    fontSize: 20
  }
});