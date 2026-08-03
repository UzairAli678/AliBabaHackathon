from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score


BASE_DIR = Path(__file__).resolve().parent
TRAINING_PATH = BASE_DIR / 'data' / 'Training.csv'
TESTING_PATH = BASE_DIR / 'data' / 'Testing.csv'
MODEL_PATH = BASE_DIR / 'disease_model.pkl'
SYMPTOMS_PATH = BASE_DIR / 'symptoms_list.pkl'
DISEASES_PATH = BASE_DIR / 'diseases_list.pkl'


def load_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f'Missing dataset: {path}')

    data = pd.read_csv(path)
    unnamed_columns = [column for column in data.columns if column.startswith('Unnamed:')]
    if unnamed_columns:
        data = data.drop(columns=unnamed_columns)

    return data


def main() -> None:
    training_data = load_dataset(TRAINING_PATH)
    testing_data = load_dataset(TESTING_PATH)

    if 'prognosis' not in training_data.columns or 'prognosis' not in testing_data.columns:
        raise ValueError('Both Training.csv and Testing.csv must contain a prognosis column.')

    symptom_columns = [column for column in training_data.columns if column != 'prognosis']
    missing_testing_columns = [column for column in symptom_columns if column not in testing_data.columns]
    missing_training_columns = [column for column in testing_data.columns if column != 'prognosis' and column not in training_data.columns]

    if missing_testing_columns or missing_training_columns:
        raise ValueError(
            'Training and testing datasets must contain the same symptom columns. '
            f'Missing in testing: {missing_testing_columns}, missing in training: {missing_training_columns}'
        )

    testing_data = testing_data[['prognosis', *symptom_columns]]
    disease_labels = sorted(training_data['prognosis'].unique().tolist())

    x_train = training_data[symptom_columns]
    y_train = training_data['prognosis']
    x_test = testing_data[symptom_columns]
    y_test = testing_data['prognosis']

    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(x_train, y_train)

    predictions = model.predict(x_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f'Testing accuracy: {accuracy:.4f}')

    joblib.dump(model, MODEL_PATH)
    joblib.dump(symptom_columns, SYMPTOMS_PATH)
    joblib.dump(disease_labels, DISEASES_PATH)


if __name__ == '__main__':
    main()