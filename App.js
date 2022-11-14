import React, { Component } from 'react';
import { useState, useEffect } from "react";
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import * as SQLite from "expo-sqlite";
import * as SplashScreen from 'expo-splash-screen';

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

function BMIs() {
  const [bmis, setBMIs] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select id, bmi, height, weight, date(bmiDate) as bmiDate from bmis order by bmiDate desc;`,
        [],
        (_, { rows: { _array } }) => setBMIs(_array)
      );
    });
  });

  if (bmis === null || bmis.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.historyHeading}>BMI History</Text>
      {bmis.map(({ id, bmi, height, weight, bmiDate }) => (
        <Text key={id} style={styles.bmiSection}>{bmiDate}:  {bmi} (W:{weight}, H:{height})</Text>
      ))}
    </View>
  );
}

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

export default function App() {
  const [height, setHeight] = useState(null);
  const [weight, setWeight] = useState(null);
  const [bmi, setBMI] = useState(null);
  const [range, setRange] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists bmis (id integer primary key not null, bmi real, height real, weight real, bmiDate real);"
      );
    });
  }, []);

  const addBMI = () => {
    if (height === null || height === "" || weight === null || weight === "") {
      return false;
    }

    const BMI = computeBMI();
    if (BMI === null || BMI === "") {
      return false;
    }

    db.transaction(
      (tx) => {
        tx.executeSql("insert into bmis (bmi, height, weight, bmiDate) values (?, ?, ?, julianday('now'))", [BMI, height, weight]);
        tx.executeSql("select * from bmis", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      }
    );
  };

  const computeBMI = () => {
    const BMI = ((weight / (height * height)) * 703).toFixed(1);
    setBMI(BMI);
    if(BMI < 18.5) {
      setRange('Underweight');
    }else if(BMI < 25) {
      setRange('Healthy');
    }else if(BMI < 30) {
      setRange('Overweight');
    }else {
      setRange('Obese');
    }
    return BMI;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.toolbar}>BMI Calculator</Text>
      {Platform.OS === "web" ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={styles.heading}>
            Expo SQlite is not supported on web!
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          <TextInput
            style={styles.input}
            onChangeText={(weight) => setWeight(weight)}
            value={weight}
            placeholder="Weight in Pounds"
          />
          <TextInput
            style={styles.input}
            onChangeText={(height) => setHeight(height)}
            value={height}
            placeholder="Height in Inches"
          />
          <TouchableOpacity onPress={() => addBMI()} style={styles.button}>
            <Text style={styles.buttonText}>Compute BMI</Text>
          </TouchableOpacity>
          <Text style={styles.bmi}>{bmi ? 'Body Mass Index is ' + bmi : ''}</Text>
          <Text style={styles.bmiRange}>{bmi ? '(' + range + ')' : ''}</Text>
          <BMIs/>
        </ScrollView>
    )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    width: '100%',
  },
  scrollContainer: {
    width: '100%',
    padding: 10,
  },
  toolbar: {
    backgroundColor: '#f4511e',
    fontSize: 28,
    fontWeight: 'bold',
    padding: 40,
    textAlign: 'center',
    width: '100%',
    color: 'white',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#ecf0f1',
    fontSize: 24,
    borderRadius: 3,
    height: 40,
    padding: 5,
    marginBottom: 10,
    flex: 1,
  },
  button: {
    backgroundColor: '#34495e',
    fontSize: 24,
    borderRadius: 5,
  },
  bmi: {
    fontSize: 28,
    textAlign: 'center',
    paddingTop: 20,
  },
  bmiRange: {
    fontSize: 28,
    textAlign: 'center',
    paddingBottom: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    padding: 10,
    fontSize: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  sectionContainer: {
    margin: 20,
  },
  bmiSection: {
    padding: 0,
    fontSize: 20,
  },
  historyHeading: {
    fontSize: 24,
    marginBottom: 4,
  },
});
