sql testSql1
select * from test.person where name='sS7SPh3EEJ'
end

sql testSql2
select * from test.person where name='385G53nh2f'
end

sql selectUserByName
select * from person where name=?
end

sql selectTopicByTitle
select * from topic where title=?
end

sql selectTopicWithPerson
select tid from hobby where pid=?
end

sql selectPersonWithTopic
select pid from hobby where tid=?
end