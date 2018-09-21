from sklearn.externals import joblib
import numpy as np
import re
import os
import json
import datasetUtils as dsu
import embeddings
import writeToS3 as s3
import argparse

def calc_tweet_personality(sessionID, screen_name, profile_img):

    # load embedding dataset
    # fixed path goes here
    dataset_path = "/Users/cwang138/Documents/Macroscope/BAE/scripts/twitPersonality/fastText/wiki-news-300d-1M.vec"
    wordDictionary = dsu.parseFastText(dataset_path)

    # load predictive models
    models = {}
    for trait in ["O","C","E","A","N"]:
        models[trait] = joblib.load("/Users/cwang138/Documents/Macroscope/BAE/scripts/twitPersonality/models/model_"+trait+".pkl")

    # read tweets
    awsPath = os.path.join(sessionID, screen_name)
    localPath = os.path.join('/Users/cwang138/Documents/Macroscope/BAE/scripts/twitPersonality/collection', sessionID)
    if not os.path.exists(localPath):
        try:
            os.makedirs(localPath)
        except:
            pass

    try:
        s3.downloadToDisk(screen_name + '_tweets.txt', localPath, awsPath)
    except:
        raise ValueError('Cannot find the timeline in the remote storage!')

    # process the tweets
    tweet_file_path = os.path.join(localPath, screen_name + '_tweets.txt')
    filteredTweets = []
    word_count = 0
    for tweet in open(tweet_file_path, "r", encoding="utf-8"):
        if re.match(r'^(RT)', tweet) or tweet == '\n' \
                or tweet == '' or tweet == ' ':
            continue

        #remove links starting with "http"
        tweet = re.sub(r'((http)([^\s]*)(\s|$))|((http)([^\s]*)$)', "", tweet)
        #remove links with no http (probably unnecessary)
        tweet = re.sub(r'(\s([^\s]*)\.([^\s]*)\/([^\s]*)\s)|(^([^\s]*)\.([^\s]*)\/([^\s]*)(\s|$))|(\s([^\s]*)\.([^\s]*)\/([^\s]*)$)', " ", tweet)
        #remove mentions
        tweet = re.sub(r'(\s(@)([^\s]*)\s)|((^@)([^\s]*)(\s|$))|(@([^\s]*)$)', " ", tweet)
        #hashtags are removed by countvectorizer
        filteredTweets.append(tweet)

        word_count += len(tweet.split())

        if len(filteredTweets) == 0:
            print("Not enough tweets for prediction.")
            continue

    #now we can process the tweet using embeddings.transofrmTextForTraining
    try:
        tweetEmbeddings = embeddings.transformTextForTesting(wordDictionary, 3, filteredTweets, "conc")
    except:
        print("Not enough tweets for prediction.")

    # predict using saved models
    # range is 0 ~ 5
    scores = {}
    for trait in ["O", "C", "E", "A", "N"]:
        model = models[trait]
        preds = model.predict(tweetEmbeddings)
        scores[trait] = float(str(np.mean(np.array(preds)))[0:5])

    jung = ""
    if scores["E"] > 3:
        jung = "E"
    else:
        jung = "I"
    if scores["O"] > 3:
        jung = jung + "N"
    else:
        jung = jung + "S"
    if scores["A"] > 3:
        jung = jung + "F"
    else:
        jung = jung + "T"
    if scores["C"] > 3:
        jung = jung + "J"
    else:
        jung = jung + "P"

    scores["jung"] = jung

    # sort the output
    result = {}
    result['screen_name'] = screen_name
    result['profile_img'] = profile_img
    result['personality'] = {
        "word_count": word_count,
        "processed_language": "en",
        'personality': [
        {'name': 'Openness', 'percentile': scores['O'] / 5},
        {'name': 'Conscientiousness', 'percentile': scores['C'] / 5},
        {'name': 'Extraversion', 'percentile': scores['E'] / 5},
        {'name': 'Agreeableness', 'percentile': scores['A'] / 5},
        {'name': 'Emotional range', 'percentile': scores['N'] / 5}]}

    # save to json and upload to s3 bucket
    with open(os.path.join(localPath, screen_name + '_twitPersonality.json'),'w') as outfile:
        json.dump(result, outfile)
    s3.upload(localPath, awsPath, screen_name + '_twitPersonality.json')

    # delete localPath files
    try:
        os.remove(os.path.join(localPath, screen_name + '_tweets.txt'))
        os.remove(os.path.join(localPath, screen_name + '_twitPersonality.json'))
    except:
        # already deleted!
        pass

    print(s3.generate_downloads(awsPath,screen_name + '_twitPersonality.json'))

    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--sessionID', required=True)
    parser.add_argument('--screenName', required=True)
    parser.add_argument('--profileImg', required=True)
    args = parser.parse_args()

    calc_tweet_personality(args.sessionID, args.screenName, args.profileImg)
