**IMPORTANT INTERPRETATION NOTES**

1. **Some things have been modified in cleaning**  
2. **0-8 spectrums were changed to 0-5 (or 1-5 i don’t remember but you shouldn’t expect to see up-to-8 scales in the data)**  
3. **Scoring was removed from this, but people did get scored stuff**  
4. **Remember that some questions are gated behind other questions. If people didn’t pass the gate, they won’t have gotten to the future questions and will be NA. In many of these you should consider these people to be implicit 0s**  
5. **Reminder some questions were added late. I marked in the file when they were added (or removed). This sometimes can make errors in your work if you aren’t looking for it.**  
6. **This version of the survey was saved at 850k. There have been mild changes since then that will be present in the 970k file, sorry**

\*Part 1/5\*  
\--edited tip to specify that male (trans) means gender at 1/16/2023, or at around 481,600 responses in (this doesn’t seem to have changed anything)  
\--edited to remove instructions and just straight update the entries at 1-23-2023, 11:19pm, I haven't checked to see how many responses we're at right now  
\*question: Which category fits you best?  
	\*tip: "Cis" is when your physical sex matches your gender, "Trans" is when your physical sex does not match your gender, and "nonbinary" doesn't identify with man or woman.  
	Man (cis)  
		\>\> biomale \= 1  
		\>\> gendermale \= 1  
		\>\> cis \= 1  
		\>\> gendered \= 1  
	Man (trans)  
		\>\> biomale \= 0  
		\>\> gendermale \= 1  
		\>\> cis \= 0  
		\>\> gendered \= 1  
		\*question: Are you currently on testosterone for HRT?  
			No  
				\>\>testosterone \=0  
			Yes, for less than 1 month  
				\>\>testosterone \=1  
			Yes, for 1-3 months  
				\>\>testosterone \=2  
			Yes, for 3-6 months  
				\>\>testosterone \=3  
			Yes, for 7-12 months  
				\>\>testosterone \=4  
			Yes, for 1-2 years  
				\>\>testosterone \=5  
			Yes, for 3-5 years  
				\>\>testosterone \=6  
			Yes, for 5-10 years  
				\>\>testosterone \=7  
			Yes, for 10+ years  
				\>\>testosterone \=8  
		\*question: Since you started taking testosterone, how regularly have you been taking it?  
			I haven't  
			Very irregularly  
				\>\>testregular=1  
			Somewhat irregularly  
				\>\>testregular=2  
			Somewhat regularly  
				\>\>testregular=3  
			Very regularly  
				\>\>testregular=4  
	Woman (cis)  
		\>\> biomale \= 0  
		\>\> gendermale \= 0  
		\>\> cis \= 1  
		\>\> gendered \= 1  
		  
\--added menstrual cycle and hormonal bc questions 11/7/24 in the evening  
		\*question:Where are you currently at in your menstrual cycle? Options are based on a typical 28 day cycle, but cycle length can change  
			Don't want to answer or don't know  
			N/A (irregular or don't get periods)  
			Am currently pregnant  
				\>\>currentlypregnant=1  
			Currently on period (week 1\)  
				\>\>cycle=1  
			Week 2 since period  
				\>\>cycle=2  
			Currently ovulating  
				\>\>cycle=3  
			Week 3 since period  
				\>\>cycle=4  
			Week 4 since period (last week before next period)  
				\>\>cycle=5

				\--removed "again, we're just checking to see if birth control impacts sexuality" from both bc and cycle questions from a tip on 7:40pm 8/10/25  
		\*question:Are you on hormonal birth control? This is the pill or any hormonal implant  
			Don't want to answer  
			Yes  
				\>\>hormonalbc=1  
			No  
				\>\>hormonalbc=0  
		\*question: Do you get mood-based PMS symptoms during your menstrual cycle?  
			\*tip: e.g., irritability, anxiety, depression  
			I don't menstruate/I don't know  
			No  
				\>\>pms \= 0  
			Yes, maybe/slightly   
				\>\>pms \= 1  
			Yes, moderately  
				\>\>pms \= 2  
			Yes, severely  
				\>\>pms \= 3  
		\--addedpms below 8/25/25  
		\*question:Are you currently experiencing PMS symptoms?  
			No  
				\>\>pmscurrent=0  
			Uncertain  
				\>\>pmscurrent=1  
			Yes  
				\>\>pmscurrent=2  
					  
	Woman (trans)  
		\>\> biomale \= 1  
		\>\> gendermale \= 0  
		\>\> cis \= 0  
		\>\> gendered \= 1  
		\*question: Are you currently on estrogen for HRT?  
			No  
				\>\>estrogen \=0  
			Yes, for less than 1 month  
				\>\>estrogen \=1  
			Yes, for 1-3 months  
				\>\>estrogen \=2  
			Yes, for 3-6 months  
				\>\>estrogen \=3  
			Yes, for 7-12 months  
				\>\>estrogen \=4  
			Yes, for 1-2 years  
				\>\>estrogen \=5  
			Yes, for 3-5 years  
				\>\>estrogen \=6  
			Yes, for 5-10 years  
				\>\>estrogen \=7  
			Yes, for 10+ years  
				\>\>estrogen \=8  
		\*question: How regularly have you been taking estrogen?  
			I haven't  
			Very irregularly  
				\>\>estregular=1  
			Somewhat irregularly  
				\>\>estregular=2  
			Somewhat regularly  
				\>\>estregular=3  
			Very regularly  
				\>\>estregular=4  
	Nonbinary/other (assigned male at birth)  
		\>\> biomale \= 1  
		\>\> gendermale \= 0  
		\>\> cis \= 0	  
		\>\> gendered \= 0  
	Nonbinary/other (assigned female at birth)  
		\>\> biomale \= 0  
		\>\> gendermale \= 0  
		\>\> cis \= 0  
		\>\> gendered \= 0  
		\*question:Where are you currently at in your menstrual cycle? Options are based on a typical 28 day cycle, but cycle length can change  
			Don't want to answer or don't know  
			N/A (irregular or don't get periods)  
			Am currently pregnant  
				\>\>currentlypregnant=1  
			Currently on period (week 1\)  
				\>\>cycle=1  
			Week 2 since period  
				\>\>cycle=2  
			Currently ovulating  
				\>\>cycle=3  
			Week 3 since period  
				\>\>cycle=4  
			Week 4 since period (last week before next period)  
				\>\>cycle=5

				\--removed "again, we're just checking to see if birth control impacts sexuality" from both bc and cycle questions from a tip on 7:40pm 8/10/25  
		\*question:Are you on hormonal birth control? This is the pill or any hormonal implant  
			Don't want to answer  
			Yes  
				\>\>hormonalbc=1  
			No  
				\>\>hormonalbc=0  
		\*question: Do you get mood-based PMS symptoms during your menstrual cycle?  
			\*tip: e.g., irritability, anxiety, depression  
			I don't menstruate/I don't know  
			No  
				\>\>pms \= 0  
			Yes, maybe/slightly   
				\>\>pms \= 1  
			Yes, moderately  
				\>\>pms \= 2  
			Yes, severely  
				\>\>pms \= 3  
		\--addedpms below 8/25/25  
		\*question:Are you currently experiencing PMS symptoms?  
			No  
				\>\>pmscurrent=0  
			Uncertain  
				\>\>pmscurrent=1  
			Yes  
				\>\>pmscurrent=2  
		\*question:Do you believe hormonal birth control causes lowered attraction to masculinity?  
			Not really  
				\>\>hbcmascimpact=0  
			Yes, a little  
				\>\>hbcmascimpact=1  
			Yes, a lot  
				\>\>hbcmascimpact=2  
		\*question:Do you believe hormonal birth control decreases sex drive?  
			Not really  
				\>\>hbcseximpact \=0  
			Yes, a little  
				\>\>hbcseximpact=1  
			Yes, a lot  
				\>\>hbcseximpact=2  
			\--added beliefs about birth control 9/1/25  
			\--added hormone stuff to the nonbinary option 8-25-25	  
\*question: You got to this survey from:  
	reddit  
	fetlife  
	twitter  
	facebook  
	amazon turk  
	discord  
	telegram  
	tumblr  
	email  
	other  
	  
\*question: Getting catcalled on the street (or the thought of getting catcalled) feels more:  
	\*tip:Assume a single, standard, objectifying catcall, such as "lookin sexy, baby" as you walk by.  
	Awesome  
		\>\>catcall=2  
	A bit positive  
		\>\>catcall=1  
	Neutral  
		\>\>catcall=0  
	A bit negative  
		\>\>catcall=-1  
	Awful  
		\>\>catcall=-2

\*question: You're sexually attracted to people with\_\_\_  
	Penises, exclusively  
		\>\> binarygender \= 0  
	Penises, mostly  
		\>\> binarygender \= 0  
	Penises, slightly  
		\>\> binarygender \= 0  
	Both equally  
		\>\> binarygender \= 1  
	Vaginas, slightly  
		\>\> binarygender \= 1  
	Vaginas, mostly  
		\>\> binarygender \= 1  
	Vaginas, exclusively  
		\>\> binarygender \= 1  
	\*save: straightness  
	  
\*question: You're more sexually attracted to people who appear visually   
	Totally masculine  
		\>\>attractedtomasculine \= 3  
	Somewhat masculine  
		\>\>attractedtomasculine \= 2  
	Slightly masculine  
		\>\>attractedtomasculine \= 1  
	Equally masculine and feminine  
		\>\>attractedtomasculine \= 0  
	Slightly feminine  
		\>\>attractedtomasculine \= \-1  
	Somewhat feminine  
		\>\>attractedtomasculine \= \-2  
	Totally feminine  
		\>\>attractedtomasculine \= \-3  
	  
I can't edit this question without messing up my data, but to clarify, 'genitals' might be better represented here by 'biological sex.' Some people get surgery to make their genitals match their gender identity.  
\*question: You're more sexually attracted to people whose gender identity \_\_\_\_ match their genitals  
	\*tip: Gender identity is the gender someone identifies and presents to the world. If it matches their genitals at birth (for example, a woman who was born with a vagina), this is cis. If it doesn't match (for example, a woman born with a penis), this is trans.  
	Does not match (trans/enby)  
		\>\>attractedtotrans \= 2  
	Slightly does not match (trans/enby)  
		\>\>attractedtotrans \= 1  
	Equally attracted to both  
		\>\>attractedtotrans \= 0  
	Slightly does match (cis)  
		\>\>attractedtotrans \= \-1  
	Does match (cis)  
		\>\>attractedtotrans \= \-2

\*question: Your ethnicity?  
	White  
	Hispanic or Latino  
	Asian (eastern)  
	Asian (other)  
	Black (African American)  
	Black (other)  
	Native American   
	Pacific Islander  
	Other

\*question: Personally, your preferred relationship style is:  
	\*tip: Monogamy is preferring a relationship structure where both people are expected not to have sexual/romantic intimacy outside the relationship. Polyamory is a relationship structure where sexual/romantic intimacy outside the relationship is allowed.  
	Very monogamous  
		\>\> polyamory \= \-3  
	Somewhat monogamous  
		\>\> polyamory \= \-2  
	Slightly monogamous  
		\>\> polyamory \= \-1  
	Halfway between mono/poly  
		\>\> polyamory \= 0  
	Slightly polyamorous  
		\>\> polyamory \= 1  
	Somewhat polyamorous  
		\>\> polyamory \= 2  
	Very polyamorous   
		\>\> polyamory \= 3

	  
\*question: What country do you live in?  
	\*tip:If you recently moved, or move often, please select the location in the past 10 years that you've spent the most time. If you aren't in any of the listed countries, then select one of the general regions at the bottom of the list.  
	United states (west)  
	United states (east)  
	United states (south)  
	United states (middle/north)  
	United states (other)  
	United Kingdom  
	Canada  
	Germany  
	Australia  
	India  
	France  
	Brazil  
	Netherlands  
	Russia  
	Sweden  
	Italy  
	Spain  
	Poland  
	Mexico  
	Other Europe (west)  
	Other Europe (east)  
	Other Europe (other)  
	Asia (east)  
	Asia (south)  
	Asia (other)  
	Africa  
	South America  
	Other  
	  
\*if: biomale=1  
	\*question: Are you circumcised?  
		No  
		Yes, as a child  
		Yes, as an adult  
\--when the fuck did i put this question in  
\*if: biomale=0  
	\*question: Can you have vaginal orgasms \*without\* clitoral stimulation?  
		No  
			\>\>vagorgasm=0  
		Rarely/with great effort  
			\>\>vagorgasm=1  
		Yes, sometimes/with medium effort  
			\>\>vagorgasm=2  
		Yes, often/with low effort  
			\>\>vagorgasm=3  
		  
\*if: not age  
	\*label: askAge  
	\*question: How old are you?  
		\*tip: You can still take this survey if you're under 18\! Your age doesn't affect your survey experience at all.  
		\*type: number  
		\*save: age

\--added sexual hookups kind of late? didn't record date i added im sorry. my guess is early 2024

\*if: biomale=0  
	\*question: "In general, casual sexual hookups have been a \_\_\_ experience for me"  
		I haven't hooked up  
		Really bad  
			\>\>hookup=-2  
		Kinda bad  
			\>\>hookup=-1  
		Neutral  
			\>\>hookup=0  
		Kinda good  
			\>\>hookup=1  
		Really good  
			\>\>hookup=2

	\*question: "In general, when my romantic relationships end, who initiates the breakup?"  
		I haven't had a relationship end  
		The other person does  
			\>\>breakup=-1  
		Equally them and me  
			\>\>breakup=0  
		I do  
			\>\>breakup \= 1  
			  
	\*question: "I usually don't leave romantic relationships unless there's a very serious violation"  
		I haven't had a relationship end  
		Strongly disagree  
			\>\>violation=-2  
		Disagree  
			\>\>violation=-1  
		Neutral  
			\>\>violation=0  
		Agree  
			\>\>violation=1  
		Strongly agree  
			\>\>violation=2  
			  
	  
\*question: As an adult, have you been the victim of sexual assault?  
	\*tip: Sexual assault means unwanted physical sexual contact from someone else, such as groping or rape.  
	No  
		\>\> sexualassaultadult \= 0  
	Yes, mild  
		\>\> sexualassaultadult \= 1  
	Yes, moderate  
		\>\> sexualassaultadult \= 2  
	Yes, severe  
		\>\> sexualassaultadult \= 3  
		  
\*question: Have you had an officially administered IQ test?  
	Yes  
		\*question: Your officially tested IQ result is:  
			\*type: number  
			\*blank  
	No

\*question: How many people have you had sex with?  
	\*tip: By your definition of 'sex' \- this typically means penetration, and sometimes includes oral sex.

	  
\*question: Your romantic relationship status is:  
	\*tip: If you have multiple romantic relationships, answer for the most serious one   
	Single  
		\>\> relationshipstatus \= 0  
	Relationship (casual)  
		\>\> relationshipstatus \= 1  
	Relationship (serious)  
		\>\> relationshipstatus \= 2  
	Relationship (married)  
		\>\> relationshipstatus \= 3  
	  
\--added gender of relationship 8-11-25	  
\*if:relationshipstatus \> 0  
	\*question:You're currently in a relationship with:  
		A man  
			\>\>relationshipgender=1  
		A woman  
			\>\>relationshipgender=0  
		Both  
			\>\>relationshipgender=-1  
		Other  
		  
\*question: Have you ever had a sexual experience with someone else who did not want the experience?  
	\*tip: And you knew that they didn't want it? This \*doesn't\* include consensual nonconsent, such as roleplaying an abduction.  
	No  
		\>\> rapist \= 0  
	Yes, slightly  
		\>\> rapist \= 1  
	Yes, significantly  
		\>\> rapist \= 2  
	Yes, extremely  
		\>\> rapist \= 3  
		  
\*question: Economically speaking, you tend to be more  
	\*tip: Economic leftists tend to prefer higher government involvement in the economy, for example more wellfare or wage regulations. Economic rightists tend to prefer lower government involvement in the economy, for example free markets and low taxes  
	Significantly liberal/left  
		\>\>Economicliberal \= 3  
	Moderately liberal/left  
		\>\>Economicliberal \= 2  
	Slightly liberal/left  
		\>\>Economicliberal \= 1  
	Equally liberal/conservative  
		\>\>Economicliberal \= 0  
	Slightly conservative/right  
		\>\>Economicliberal \= \-1  
	Moderately conservative/right  
		\>\>Economicliberal \= \-2  
	Significantly conservative/right  
		\>\>Economicliberal \= \-3  
	  
\*question: Socially speaking, you tend to be more  
	\*tip: Social leftists tend to prefer lower government involvement in social issues, for example allowing drugs and abortions. Social rightists tend to prefer higher government involvement in social issues, for example outlawing sex work or obscenities.  
	Significantly liberal/left  
		\>\>Socialliberal \= 3  
	Moderately liberal/left  
		\>\>Socialliberal \= 2  
	Slightly liberal/left  
		\>\>Socialliberal \= 1  
	Equally liberal/conservative  
		\>\>Socialliberal \= 0  
	Slightly conservative/right  
		\>\>Socialliberal \= \-1  
	Moderately conservative/right  
		\>\>Socialliberal \= \-2  
	Significantly conservative/right  
		\>\>Socialliberal \= \-3  
	  
\*question: What's your height?  
	\<5'0" (\<152cm)  
		\>\> height \= 60  
	5'1 (155cm)  
		\>\> height \= 61  
	5'2 (158cm)  
		\>\> height \= 62  
	5'3 (161cm)  
		\>\> height \= 63  
	5'4 (163cm)  
		\>\> height \= 64  
	5'5 (165cm)  
		\>\> height \= 65  
	5'6 (168cm)  
		\>\> height \= 66  
	5'7 (170cm)  
		\>\> height \= 67  
	5'8 (173cm)  
		\>\> height \= 68  
	5'9  (175cm)  
		\>\> height \= 69  
	5'10 (178cm)  
		\>\> height \= 70  
	5'11 (180cm)  
		\>\> height \= 71  
	6'0 (183cm)  
		\>\> height \= 72  
	6'1 (185cm)  
		\>\> height \= 73  
	6'2 (188cm)  
		\>\> height \= 74  
	6'3 (191cm)  
		\>\> height \= 75  
	6'4 (193cm)  
		\>\> height \= 76  
	6'5 (196cm)  
		\>\> height \= 77  
	6'6+ (198cm)  
		\>\> height \= 78  
	  
\*question: Your weight is closest to:  
	\<90lbs (\<41kg)  
		\>\> weight \= 90  
	110lbs (50kg)  
		\>\> weight \= 110  
	130lbs (59kg)  
		\>\> weight \= 130  
	150lbs (68kg)  
		\>\> weight \= 150  
	170lbs (77kg)  
		\>\> weight \= 170  
	190lbs (86kg)  
		\>\> weight \= 190  
	210lbs (95kg)  
		\>\> weight \= 210  
	230lbs (104kg)  
		\>\> weight \= 230  
	250lbs (113kg)  
		\>\> weight \= 250  
	270lbs (123kg)  
		\>\> weight \= 270  
	290lbs (132kg)  
		\>\> weight \= 290  
	310lbs (141kg)  
		\>\> weight \= 310  
	330lbs (150kg)  
		\>\> weight \= 330  
	\>350lbs (\>159kg)  
		\>\> weight \= 370  
	

\*Part 2/5\*

\*Childhood Questions\*  
I'm asking about ages 0-16; if you're unsure how to answer, just assume 'typically', 'in general', or 'for the majority of the time.' 

Some questions are about "childhood culture" \- this is about the general norms of the world you lived in, including parents, school, media, friends \- all the behavioral expectations you were placed under.  
\*button: Sounds good\!

\*question: How "sexually liberated" was your upbringing?  
	\*tip:  "Highly repressed" might be a highly conservative religious community where ankles must be covered, and "Highly liberated" might be a community where free love, nudity, or sexual expression was encouraged.  
	Highly repressed  
		\>\>repressedupbringing \= 3  
	Moderately repressed  
		\>\>repressedupbringing \= 2  
	Slightly repressed  
		\>\>repressedupbringing \= 1  
	Equally repressed/liberated  
		\>\>repressedupbringing \= 0  
	Slightly liberated  
		\>\>repressedupbringing \= \-1  
	Moderately liberated  
		\>\>repressedupbringing \= \-2  
	Highly liberated  
		\>\>repressedupbringing \= \-3

\*question: At what age did you first begin (at least semiregularly) masturbating?  
	I've never masturbated  
	5 or younger  
		\>\> fapage \= 4  
	6  
		\>\> fapage \= 6  
	7  
		\>\> fapage \= 7  
	8  
		\>\> fapage \= 8  
	9  
		\>\> fapage \= 9  
	10  
		\>\> fapage \= 10  
	11  
		\>\> fapage \= 11  
	12  
		\>\> fapage \= 12  
	13  
		\>\> fapage \= 13  
	14  
		\>\> fapage \= 14  
	15  
		\>\> fapage \= 15  
	16  
		\>\> fapage \= 16  
	17  
		\>\> fapage \= 17  
	18 or older  
		\>\> fapage \= 19  
	  
\*question: At what age did you first have penetrative sexual intercourse?  
	I haven't had sex  
	12 or younger  
		\>\> sexage \= 11  
	13  
		\>\> sexage \= 13  
	14  
		\>\> sexage \= 14  
	15  
		\>\> sexage \= 15  
	16  
		\>\> sexage \= 16  
	17  
		\>\> sexage \= 17  
	18  
		\>\> sexage \= 18  
	19  
		\>\> sexage \= 19  
	20  
		\>\> sexage \= 20  
	21  
		\>\> sexage \= 21  
	22  
		\>\> sexage \= 22  
	23  
		\>\> sexage \= 23  
	24  
		\>\> sexage \= 24  
	25  
		\>\> sexage \= 25  
	26-30  
		\>\> sexage \= 28  
	31-35  
		\>\> sexage \= 34  
	36-40  
		\>\> sexage \= 38  
	41+  
		\>\> sexage \= 45

\*question: What religion did you grow up in?  
	None or performative/casual religion  
	Christianity (protestant)  
	Christianity (catholic)  
	Christianity (other)  
	Judaism  
	Islam  
	Hinduism  
	Buddhism  
	Chinese traditional religion  
	Sikhism  
	Bahai  
	Jainism  
	Shinto  
	Anti-religious/explicitly atheist  
	Other  
	\*save: Religion  
	  
\*if: not (Religion \= "None or performative/casual religion")  
	\*question: How important was EXTERNAL adherence to the religion? For example: tithing, church attendance, standards of dress, passover, romantic behavior, chanting, etc.   
		\*tip: As in: how much emphasis did your culture place on making sure rules of the religion were followed  
		Not at all important  
			\>\>externalreligion \= 0  
		Slightly important  
			\>\>externalreligion \= 1  
		Moderately important  
			\>\>externalreligion \= 2  
		Very important  
			\>\>externalreligion \= 3  
		Absolutely essentially important  
			\>\>externalreligion \= 4  
	  
\*if: not (Religion \= "None or performative/casual religion")  
	\*question: How important was INTERNAL adherence to the religion? For example: feeling guilty, private prayer, getting "right with god", achieving specific mental states, etc.?  
		\*tip: As in: how much emphasis did your culture place on making sure people's internal mental states were obedient to religion  
		Not at all important  
			\>\>internalreligion \= 0  
		Slightly important  
			\>\>internalreligion \= 1  
		Moderately important  
			\>\>internalreligion \= 2  
		Very important  
			\>\>internalreligion \= 3  
		Absolutely essentially important  
			\>\>internalreligion \= 4

	  
\*question: In your childhood culture, how did people feel about "traditional gender role violations"  
	\*tip: (like women being childless bosses and men being nurturing househusbands)?   
	So normal nobody noticed  
		\>\> genderroleviolation \= 0  
	Mostly normal, occasionally would get a comment  
		\>\> genderroleviolation \= 1	  
	Somewhat normal, would generate some discussion  
		\>\> genderroleviolation \= 2	  
	Not very normal; it was done but generated disapproval  
		\>\> genderroleviolation \= 3	  
	Mostly abnormal; rarely done/generated strong disapproval  
		\>\> genderroleviolation \= 4  
	Nearly unheard of, if done generated full community eviction  
		\>\> genderroleviolation \= 5

\*question: In your childhood culture, how did people feel about visible genderbending  
	\*tip: (e.g. women shaving their head or "dressing like a lesbian" or men wearing traditionally feminine clothing, like skirts and makeup)?  
	So normal nobody noticed  
		\>\> genderbendingviolation \= 0  
	Mostly normal, occasionally would get a comment  
		\>\> genderbendingviolation \= 1	  
	Somewhat normal, would generate some discussion  
		\>\> genderbendingviolation \= 2	  
	Not very normal; it was done but generated disapproval  
		\>\> genderbendingviolation \= 3	  
	Mostly abnormal; rarely done/generated strong disapproval  
		\>\> genderbendingviolation \= 4	  
	Nearly unheard of, if done generated full community eviction  
		\>\> genderbendingviolation \= 5  
		  
\*question: Growing up, your family was  
	\*tip: Compared to most of the people in your country  
	Underclass (very poor)  
		\>\> socialClass \= 0  
	Low class  
		\>\> socialClass \= 1  
	Lower-middle class  
		\>\> socialClass \= 2  
	Middle class  
		\>\> socialClass \= 3  
	Upper-middle class  
		\>\> socialClass \= 4  
	Upper class  
		\>\> socialClass \= 5  
	Elite class (very rich)  
		\>\> socialClass \= 6  
	  
\*question: How clean was your childhood home?  
	\*tip: As in; how messy, dirty, how much mold/dust/food, how disorganized?  
	Very clean  
		\>\>cleanness \= 3  
	Somewhat more clean  
		\>\>cleanness \= 2  
	Slightly more clean  
		\>\>cleanness \= 1  
	Equally dirty/clean  
		\>\>cleanness \= 0  
	Slightly more dirty  
		\>\>cleanness \= \-1  
	Somewhat more dirty  
		\>\>cleanness \= \-2  
	Very more dirty  
		\>\>cleanness \= \-3

	  
\*question: Was agency/responsibility placed more on you, or the world?   
	\*tip: Was it on you (buck up, pull yourself up by bootstraps, individualism, grin and bear it) or was it on the world (fight for a change, ask for help, sympathy for suffering, demand what you're owed)?  
	Totally on me  
		\>\>responsibilityonme \= 3  
	Moderately on me  
		\>\>responsibilityonme \= 2  
	Slightly on me  
		\>\>responsibilityonme \= 1  
	Equally on me and the world  
		\>\>responsibilityonme \= 0  
	Slightly on the world  
		\>\>responsibilityonme \= \-1  
	Moderately on the world  
		\>\>responsibilityonme \= \-2  
	Totally on the world  
		\>\>responsibilityonme \= \-3

\*question: From the ages of 0-14, how often were you spanked as a form of discipline?  
	\*tip: Spanking means striking the buttocks, with a hand or an implement such as a shoe or belt  
	Never  
		\>\>spankedfrequency \= 0  
	Rarely  
		\>\>spankedfrequency \= 1  
	Sometimes  
		\>\>spankedfrequency \= 2  
	Often  
		\>\>spankedfrequency \= 3  
	Very regularly  
		\>\>spankedfrequency \= 4

\*if: spankedfrequency \> 0  
	\*question: Typically speaking, how painful were the spankings?  
		Not painful  
			\>\>spankpainlevelchildhood \= 0  
		Slightly painful  
			\>\>spankpainlevelchildhood \= 1  
		Moderately painful  
			\>\>spankpainlevelchildhood \= 2  
		Very painful  
			\>\>spankpainlevelchildhood \= 3  
		Extremely painful   
			\>\>spankpainlevelchildhood \= 4  
	  
\*question: Were you (at least semiregularly) abused as a child?  
	\*tip: "Abuse" means cruel treatment, such as significant neglect, insulting, or causing physical damage. This question does \*not\* include spanking  
	No  
		\>\> abuseyes1no0 \= 0  
	Yes  
		\>\> abuseyes1no0 \= 1  
	\*save: abuse

\*if: abuse \= "Yes"  
	\*question: During your childhood, how often were you verbally abused by an adult man?  
		\*tip: With 'verbal abuse' including things like insults, predictions you will fail in life, degrading you, etc.  
		Never  
			\>\>verbalmanabuse \= 0  
		Rarely  
			\>\>verbalmanabuse \= 1  
		Sometimes  
			\>\>verbalmanabuse \= 2  
		Often  
			\>\>verbalmanabuse \= 3  
		Very regularly  
			\>\>verbalmanabuse \= 4  
		  
	\*question: During your childhood, how often were you \*verbally\* abused by an adult \*woman\*?  
		\*tip: With 'verbal abuse' including things like insults, predictions you will fail in life, degrading you, etc.  
		Never  
			\>\>verbalwomanabuse \= 0  
		Rarely  
			\>\>verbalwomanabuse \= 1  
		Sometimes  
			\>\>verbalwomanabuse \= 2  
		Often  
			\>\>verbalwomanabuse \= 3  
		Very regularly  
			\>\>verbalwomanabuse \= 4  
			  
	\*question: During your childhood, how often were you neglected?  
		\*tip: Neglect meaning things like your parents or guardians failing to properly feed, clothe, or shelter you.  
		Never  
			\>\>neglectabuse \= 0  
		Rarely  
			\>\>neglectabuse \= 1  
		Sometimes  
			\>\>neglectabuse \= 2  
		Often  
			\>\>neglectabuse \= 3  
		Very regularly  
			\>\>neglectabuse \= 4  
		  
	\*question: During your childhood, how often were you \*physically\* abused by a \*man\*?  
		\*tip: Not including spankings  
		Never  
			\>\>physicalmanabuse \= 0  
		Rarely  
			\>\>physicalmanabuse \= 1  
		Sometimes  
			\>\>physicalmanabuse \= 2  
		Often  
			\>\>physicalmanabuse \= 3  
		Very regularly  
			\>\>physicalmanabuse \= 4  
		  
	\*question: During your childhood, how often were you \*physically\* abused by a \*woman\*?  
		\*tip: Not including spankings  
		Never  
			\>\>physicalwomanabuse \= 0  
		Rarely  
			\>\>physicalwomanabuse \= 1  
		Sometimes  
			\>\>physicalwomanabuse \= 2  
		Often  
			\>\>physicalwomanabuse \= 3  
		Very regularly  
			\>\>physicalwomanabuse \= 4

	  
\*question: Which best describes your parents' presence in your lives?  
	Both mother and father present  
		\>\> motherpresence \= 1  
		\>\> fatherpresence \= 1  
		\>\> parentpresence \= 2  
	Mother present, father absent  
		\>\> motherpresence \= 1  
		\>\> fatherpresence \= 0  
		\>\> parentpresence \= 1  
	Father present, mother absent  
		\>\> motherpresence \= 0  
		\>\> fatherpresence \= 1  
		\>\> parentpresence \= 1  
	Both mother and father absent  
		\>\> motherpresence \= 0  
		\>\> fatherpresence \= 0  
		\>\> parentpresence \= 0

	  
\*question: Did you experience sexual assault in your childhood?  
	No	  
		\>\> sexualassaultchildhood \= 0  
	Yes, mild  
		\>\> sexualassaultchildhood \= 1  
	Yes, moderate  
		\>\> sexualassaultchildhood \= 2  
	Yes, severe  
		\>\> sexualassaultchildhood \= 3  
	\*save: sexualAssaultLevel  
\*if: not (sexualAssaultLevel \= "No")  
	\*question: Who was the offender?  
		\*type: checkbox  
		Mother  
		Father  
		Sibling  
		Extended family or a close family friend  
		Someone I didn't know well  
			  
\*question: How many siblings did you grow up with?  
	0  
		\>\>siblingnumber \= 0  
	1  
		\>\>siblingnumber \= 1  
	2  
		\>\>siblingnumber \= 2  
	3  
		\>\>siblingnumber \= 3  
	4  
		\>\>siblingnumber \= 4  
	5  
		\>\>siblingnumber \= 5  
	6  
		\>\>siblingnumber \= 6  
	7+  
		\>\>siblingnumber \= 7

\*if: not(siblingnumber \= 0\)  
	\*question: You were the \_\_\_ child among your siblings  
		Firstborn  
			\>\>birthorder \= 1  
		Secondborn  
			\>\>birthorder \= 2  
		Thirdborn  
			\>\>birthorder \= 3  
		Fourthborn  
			\>\>birthorder \= 4  
		Fifthborn  
			\>\>birthorder \= 5  
		Sixthborn  
			\>\>birthorder \= 6  
		Seventhborn or more  
			\>\>birthorder \= 7

	\*question: Your siblings are mostly  
		Male  
			\>\>siblingsmostlymale \= 1  
		Female  
			\>\>siblingsmostlymale \= \-1  
		Equal mix  
			\>\>siblingsmostlymale \= 0

\>\> agreementScale \= \[\["Totally agree", 3\], \["Agree", 2\], \["Somewhat agree", 1\], \["Neither agree nor disagree", 0\], \["Somewhat disagree", \-1\], \["Disagree", \-2\],  \["Totally disagree", \-3\]\]

\*question: "I am relaxed most of the time"  
	\*answers: agreementScale  
	\*save: neuroticism

\*question: "I sympathize with others' feelings"  
	\*answers: agreementScale  
	\*save: agreeableness2  
	  
\*question: “I deserve more respect than I get”  
	\*answers: agreementScale  
	\*save: power  
	  
\*question: "I don't have very much power over those around me"  
	\*answers: agreementScale  
	\*save: power2

\*question: "I shirk my duties"  
	\*answers: agreementScale  
	\*save: consciensiousness  
	  
\*question: "I have excellent ideas"  
	\*answers: agreementScale  
	\*save: openness2  
	  
\*question: "I am high powered, driven, successful"  
	\*answers: agreementScale  
	  
\*question: "I feel little concern for others"  
	\*answers: agreementScale  
	\*save: agreeableness

\*question: "I am the life of the party"  
	\*answers: agreementScale  
	\*save: extroversion2  
	  
\*question: "I worry about things."  
	\*answers: agreementScale  
	\*save: neuroticism2

\*question: "I need to feel in control"  
	\*answers: agreementScale

\--ADDED 2:16PM CST, 3/8/23  
\*question: "I've experienced a lot of sexual harrassment"  
	\*answers: agreementScale  
	  
\*question: "I am quiet around strangers"  
	\*answers: agreementScale  
	\*save: extroversion  
	  
\*question: "I like order"  
	\*answers: agreementScale  
	\*save: consciensiousness2  
	  
\*question: "I have difficulty understanding abstract ideas"  
	\*answers: agreementScale  
	\*save: openness

\*question: "If life is a game, then I'm losing"  
	\*answers: agreementScale  
	\*save: power3  
	  
\*question: "I find the existence of the supernatural to be plausible"  
	\*tip: e.g., ghosts, multi-dimensional beings, energy healing, astrology, etc.  
	\*answers: agreementScale  
	  
\>\> opennessvariable \= openness2 \- openness  
\>\> consciensiousnessvariable \= consciensiousness2 \- consciensiousness  
\>\> extroversionvariable \= extroversion2 \- extroversion  
\>\> neuroticismvariable \= neuroticism2 \- neuroticism  
\>\> agreeablenessvariable \= agreeableness2 \- agreeableness  
\>\> powerlessnessvariable \= power3 \+ power2 \+ power

\*question: What's your attachment style?  
	\*tip: Attachment style is the way you typically relate to relationships, usually romantic  
	Don't know/not sure  
	Avoidant (avoidant/distant/commitment fears),   
	Anxious (codependent/clingy/abandonment fears)  
	Disorganized (mix of Avoidant and Anxious)  
	Secure (comfortable with intimacy)

\*question: Do you have any of the following  
	\*type: checkbox  
	\*tip: Please only check if they're 'moderate to severe'  
	ADHD  
	Anorexia  
	Anxiety  
	Autism  
	Bipolar I  
	Bipolar II  
	Body Dysmorphia  
	Borderline  
	Bulimia  
	C-PTSD  
	Depersonalization/derealization  
	Depression  
	Disassociative Identity Disorder  
	OCD  
	PTSD  
	Schizophrenia  
	Social anxiety  
	Sociopathy  
	Substance Abuse Disorder  
	\*save: mentalillness

	  
\*question: Compared to other people of your same gender and age range, you are  
	Significantly less attractive  
		\>\>hotterthanothers \= \-3  
	Moderately less attractive  
		\>\>hotterthanothers \= \-2  
	Slightly less attractive  
		\>\>hotterthanothers \= \-1  
	About average attractiveness  
		\>\>hotterthanothers \= 0  
	Slightly more attractive  
		\>\>hotterthanothers \= 1  
	Moderately more attractive  
		\>\>hotterthanothers \= 2  
	Significantly more attractive  
		\>\>hotterthanothers \= 3

SECTION 2

\*settings  
	\*back: yes  
\*Part 3/5\*  
\*Sex fantasy questions\*  
Some things to keep in mind:  
Our sexual fantasies are different from what we do in real life. I'm going to ask about some things that might seem cruel if actually done; being aroused by a taboo erotic fantasy does /not/ mean you would violate consent in real life. Please answer according to your ideal fantasies, even if you would never actually act on it.  
\*button: Understood, this is about fantasy

In this survey, I'll ask about a bunch of specific elements. Answer for each element in isolation. For example, if you are really into peeing onto clowns in bondage, then answer yes for 'peeing' and 'clowns' and 'bondage,' even if it's only mostly erotic when they're all combined. 

\*button: Gotcha

There's a lot of fetishes out there\! To narrow them down, here's a list of things you might be into. Check any that you're \*definitely\* into. Do not check things that "might be kinda hot in the right circumstances".

A good test is "have you searched porn of this thing", "have you masturbated to fantasies about this thing", or "have you asked a sexual partner to participate in this thing"  
\*button: Cool, I understand  
\--added horny questions 12:23 am 5/17/25, unfucked the saving on 5/20  
\*question:How horny have you been in the last 24 hours?  
	Not horny at all  
		\>\>horny24=0  
	A little horny  
		\>\>horny24=1  
	Moderately horny  
		\>\>horny24=2  
	Real horny  
		\>\>horny24=3  
		  
\*question:How horny are you right now?  
	Not horny at all  
		\>\>hornynow=0  
	A little horny  
		\>\>hornynow=1  
	Moderately horny  
		\>\>hornynow=2  
	Real horny  
		\>\>hornynow=3  
	

	  
\*question: Check all that apply: Scenarios you find erotic tend to involve \*you\* feeling  
	\*tip: This is about you\! Not others. And remember \- 'could be into, maybe' doesn't count \- check things you're at least moderately into.  
	\*type: checkbox  
	Eagerness or desire  
	Wildness or primalness  
	Irritation or annoyance  
	Ambivalence or disinterest  
	Numbness or disassociation  
	Calmness or serenity  
	Safety or warmth  
	Love or romance  
	Shyness or nervousness  
	Powerlessness or vulnerability  
	Hesitation or reluctance  
	Shock or surprise  
	Fear or trepidation  
	Humiliation or worthlessness  
	Embarrassment or shame  
	Grief or regret  
	Despair or horror  
	Disgust or revulsion  
	Anger or tension  
	Hate or disdain  
	Cruelty or brutality  
	Power or smugness  
	\*save: youfeel  
	

	  
That last question was about you, this next question is about others.  
\*button: Continue 

\*question: Check all that apply: Scenarios you find erotic tend to involve \*the other person/people/creatures\* feeling  
	\*tip: This is about others\! Not you. And remember \- 'could be into, maybe' doesn't count \- check things you're at least moderately into.  
	\*type: checkbox  
	Eagerness or desire  
	Wildness or primalness  
	Irritation or annoyance  
	Ambivalence or disinterest  
	Numbness or disassociation  
	Calmness or serenity  
	Safety or warmth  
	Love or romance  
	Shyness or nervousness  
	Powerlessness or vulnerability  
	Hesitation or reluctance  
	Shock or surprise  
	Fear or trepidation  
	Humiliation or worthlessness  
	Embarrassment or shame  
	Grief or regret  
	Despair or horror  
	Disgust or revulsion  
	Anger or tension  
	Hate or disdain  
	Cruelty or brutality  
	Power or smugness  
	\*save: otherfeel1

	

\>\> agreementScale \= \[\["Totally agree", 3\], \["Agree", 2\], \["Somewhat agree", 1\], \["Neither agree nor disagree", 0\], \["Somewhat disagree", \-1\], \["Disagree", \-2\],  \["Totally disagree", \-3\]\]

\>\>arousalScale \= \[\["Not arousing", 0\], \["Slightly arousing", 1\], \["Somewhat arousing", 2\], \["Moderately arousing", 3\], \["Very arousing", 5\], \["Extremely arousing", 8\]\]

\>\>vanillaarousalScale \= \[\["Not arousing", 0\], \["Slightly arousing", \-1\], \["Somewhat arousing", \-2\], \["Moderately arousing", \-3\], \["Very arousing", \-5\], \["Extremely arousing", \-8\]\]

\*question: Your sexual interests feel  
	\*tip: As in; do you require a very specific set of circumstances to feel aroused, or is a wide variety of things arousing to you?  
	Very narrow  
		\>\> broadness \= \-3  
	Somewhat narrow   
		\>\> broadness \= \-2  
	A little narrow  
		\>\> broadness \= \-1  
	Equally narrow and broad  
		\>\> broadness \= 0  
	A little broad  
		\>\> broadness \= 1  
	Somewhat broad   
		\>\> broadness \= 2  
	Very broad  
		\>\> broadness \= 3  
	  
\*question: How often do you watch or read pornographic/erotic content?  
	\*tip: for the purposes of getting aroused  
	I don't  
		\>\> pornhabit \= 0  
	Multiple times a day  
		\>\> pornhabit \= 9  
	Daily  
		\>\> pornhabit \= 8  
	Multiple times a week  
		\>\> pornhabit \= 7  
	Once a week  
		\>\> pornhabit \= 6  
	A few times a month  
		\>\> pornhabit \= 5  
	Once a month  
		\>\> pornhabit \= 4  
	A few times a year  
		\>\> pornhabit \= 3  
	Once a year  
		\>\> pornhabit \= 2  
	Less than once a year  
		\>\> pornhabit \= 1  
	\*save: pornrate  
	  
\*if: not pornhabit \= 0  
	\*question: The type of erotic content you prefer tends to be more  
		Entirely animated/drawn  
			\>\>animated \= 2  
		Mostly animated/drawn  
			\>\>animated \= 1  
		Equal/even split  
			\>\>animated \= 0  
		Mostly live action vid/photos  
			\>\>animated \= \-1  
		Entirely live action vid/photos  
			\>\>animated \= \-2

		  
\*if: not pornhabit \= 0  
	\*question: The type of erotic content you prefer tends to be:  
		Entirely written  
			\>\>written \= 2  
		Mostly written  
			\>\>written \= 1  
		Equally written and visual  
			\>\>written \= 0  
		Mostly visual  
			\>\>written \= \-1  
		Entirely visual  
			\>\>written \= \-2

\*if: not pornhabit \= 0  
	\*question: How much of the porn or erotica you watch is violent?  
		\*tip: Including depictions of nonconsent, struggling, or physical agression.  
		None of it  
			\>\> violentporn \= 0  
		A little bit  
			\>\> violentporn \= 1  
		A moderate amount  
			\>\> violentporn \= 2  
		Most of it  
			\>\> violentporn \= 3  
		All of it  
			\>\> violentporn \= 4  
			  
\*if: not pornhabit \= 0  
	\*question: At what age did you begin watching porn or reading erotic content at least semiregularly?  
		\>6yo  
			\>\> pornstart \= 5  
		7-8yo  
			\>\> pornstart \= 7  
		9-10yo  
			\>\> pornstart \= 9  
		11-12yo  
			\>\> pornstart \= 11  
		13-14yo  
			\>\> pornstart \= 13  
		15-16yo  
			\>\> pornstart \= 15  
		17-18yo  
			\>\> pornstart \= 17  
		19-25yo  
			\>\> pornstart \= 22  
		26yo+  
			\>\> pornstart \= 28		

\--added sex work questions 10/28/2024 1:40pm est  
\*question:Have you done sex work (as a performer/provider/etc.?)  
	Yes  
		\>\>sexworker=1  
	No  
		\>\>sexworker=0  
		  
\*if:sexworker=1  
	\*question:How experienced are you in working as a cam performer, or for a subscription site?   
		\*tip: E.g. \- onlyfans, myfreecams, chaturbate, fansly, clips4sale, livejasmin, loyalfans, etc.  
		Not at all  
			\>\>sexworkinternet=0  
		Dabbled/tried it out  
			\>\>sexworkinternet=1  
		Moderately experienced  
			\>\>sexworkinternet=2  
		Very experienced  
			\>\>sexworkinternet=3  
		Extensively, lifelong career or similar  
			\>\>sexworkinternet=4  
	  
	\*if:sexworkinternet\>0  
		\*question:In general, your experience in working as a cam performer or subscription site (onlyfans, chaturbate, etc) has been:  
			Very negative  
				\>\>sexworkinternetrating=-3  
			Moderately negative  
				\>\>sexworkinternetrating=-2  
			Slightly negative  
				\>\>sexworkinternetrating=-1  
			Slightly positive  
				\>\>sexworkinternetrating=1  
			Moderately positive  
				\>\>sexworkinternetrating=2  
			Very positive  
				\>\>sexworkinternetrating=3  
				  
\*if:sexworker=1  
	\*question:How experienced are you in working as a pornographic actor for a studio or production company?   
		\*tip:NOT including amateur productions or onlyfans  
		Not at all  
			\>\>sexworkporn=0  
		Dabbled/tried it out  
			\>\>sexworkporn=1  
		Moderately experienced  
			\>\>sexworkporn=2  
		Very experienced  
			\>\>sexworkporn=3  
		Extensively, lifelong career or similar  
			\>\>sexworkporn=4  
	  
	\*if:sexworkporn\>0  
		\*question:In general, your experience working as a pornographic actor for a studio or production company has been:  
			Very negative  
				\>\>sexworkpornrating=-3  
			Moderately negative  
				\>\>sexworkpornrating=-2  
			Slightly negative  
				\>\>sexworkpornrating=-1  
			Slightly positive  
				\>\>sexworkpornrating=1  
			Moderately positive  
				\>\>sexworkpornrating=2  
			Very positive  
				\>\>sexworkpornrating=3			

\*if:sexworker=1  
	\*question:How experienced are you in working as a stripper or similar?  
		Not at all  
			\>\>sexworkstripper=0  
		Dabbled/tried it out  
			\>\>sexworkstripper=1  
		Moderately experienced  
			\>\>sexworkstripper=2  
		Very experienced  
			\>\>sexworkstripper=3  
		Extensively, lifelong career or similar  
			\>\>sexworkstripper=4  
	  
	\*if:sexworkstripper\>0  
		\*question:In general, your experience working as a stripper has been:  
			Very negative  
				\>\>sexworkstripperrating=-3  
			Moderately negative  
				\>\>sexworkstripperrating=-2  
			Slightly negative  
				\>\>sexworkstripperrating=-1  
			Slightly positive  
				\>\>sexworkstripperrating=1  
			Moderately positive  
				\>\>sexworkstripperrating=2  
			Very positive  
				\>\>sexworkstripperrating=3	

\*if:sexworker=1  
	\*question:How experienced are you in working as a non-full-service sex worker? (This is any in-person sex work that DOES involve physical contact, but DOESN'T include penetration \- such as a massage parlor worker or dominatrix)  
		Not at all  
			\>\>sexworknfs=0  
		Dabbled/tried it out  
			\>\>sexworknfs=1  
		Moderately experienced  
			\>\>sexworknfs=2  
		Very experienced  
			\>\>sexworknfs=3  
		Extensively, lifelong career or similar  
			\>\>sexworknfs=4  
	  
	\*if:sexworknfs\>0  
		\*question:In general, your experience working as a NON-full-service sex worker has been:  
			Very negative  
				\>\>sexworknfsrating=-3  
			Moderately negative  
				\>\>sexworknfsrating=-2  
			Slightly negative  
				\>\>sexworknfsrating=-1  
			Slightly positive  
				\>\>sexworknfsrating=1  
			Moderately positive  
				\>\>sexworknfsrating=2  
			Very positive  
				\>\>sexworknfsrating=3	  
				  
\*if:sexworker=1  
	\*question:How experienced are you in working as a full-service sex worker? This is sex work that DOES include penetration  
		Not at all  
			\>\>sexworkfs=0  
		Dabbled/tried it out  
			\>\>sexworkfs=1  
		Moderately experienced  
			\>\>sexworkfs=2  
		Very experienced  
			\>\>sexworkfs=3  
		Extensively, lifelong career or similar  
			\>\>sexworkfs=4  
	  
	\*if:sexworkfs\>0  
		\*question:In general, your experience working as a full-service sex worker has been:  
			Very negative  
				\>\>sexworkfsrating=-3  
			Moderately negative  
				\>\>sexworkfsrating=-2  
			Slightly negative  
				\>\>sexworkfsrating=-1  
			Slightly positive  
				\>\>sexworkfsrating=1  
			Moderately positive  
				\>\>sexworkfsrating=2  
			Very positive  
				\>\>sexworkfsrating=3	

\--added john question 11/17/24				  
\*question: Have you ever hired a sex worker for a sexual interaction in real life? NOT including online sex work  
	No  
		\>\>john=0  
	Yes, but no penetration  
		\>\>john=1  
	Yes, with penetration  
		\>\>john=2  
	  
\*question: "If my partner is aroused by something, I can also be aroused by it, even if I don't normally find it erotic"  
	\*answers: agreementScale  
	  
\*question: "I am ashamed or embarrassed about at least some of what arouses me"  
	\*answers: agreementScale  
	  
\*question: "Engaging with or fantasizing about what arouses me feels therapeutic or healing to me"  
	\*answers: agreementScale  
	  
\*question: "I can get aroused by a partner doing what I like, even if I know they aren't aroused by it themselves"  
	\*answers: agreementScale  
	  
\*question: "I've acted upon or experimented with all the things that arouse me"  
	\*answers: agreementScale  
	  
\*question: Have you paid for porn/erotic content?  
	No  
		\>\> pornpayment \= 0  
	Once or twice  
		\>\> pornpayment \= 1  
	Occasionally  
		\>\> pornpayment \= 2  
	Regularly  
		\>\> pornpayment \= 3

\*Part 4/5\*

\*question: "In general, on average, the optimal amount of consent in my preferred erotic scenarios is:"  
	\*tip: Remember, this is fantasy only\! Even if you fantasize about nonconsent, you can agree it's important to get full consent in real life.  
	Full, enthusiastic consent  
		\>\> consent \= 2  
	Mostly consenting, slightly nonconsenting  
		\>\> consent \= 1  
	Equally consenting and nonconsenting  
		\>\> consent \= 0  
	Mostly nonconsenting, slightly consenting  
		\>\> consent \= \-1  
	Full nonconsent  
		\>\> consent \= \-2

		  
\*question: Which describes you best?  
	Totally dominant  
		\>\>dom \= 3  
	Moderately dominant  
		\>\>dom \= 2  
	Slightly dominant  
		\>\>dom \= 1  
	Switch/equal/no preference  
		\>\>dom \= 0  
	Slightly submissive  
		\>\>dom \= \-1  
	Moderately submissive  
		\>\>dom \= \-2  
	Totally submissive  
		\>\>dom \= \-3  
		  
\*question: "I am aroused by being dominant in sexual interactions"  
	\*answers: agreementScale  
	  
\*question: "I am aroused by being submissive in sexual interactions"  
	\*answers: agreementScale

	  
\*question: "I sometimes find people who have clearly reached sexual maturity, but are not yet adults (e.g., ages 13-17), to be sexually attractive"  
	\*tip: Reminder: These questions are about fantasies, not about what you would actually do  
	\*answers: agreementScale  
	  
\*question: In scenarios you find erotic, you tend to identify with (or imagine being):  
	Totally one specific role  
		\>\>allroleidentity \= \-2  
	Somewhat one specific role  
		\>\>allrollidentity \= \-1  
	Somewhat all the roles at once  
		\>\>allrollidentity \= 1  
	Totally all the roles at once  
		\>\>allrollidentity \= 2

\*question: "I find it erotic when two people of the opposite gender to me sexually interact with each other"  
	\*tip: For example, if you are a man, then this would be imagining two women  
	\*answers: agreementScale

\*question: You \_\_\_\_\_\_ what arouses you  
	Fully know  
		\>\>knowwhatarousesyou \= 3  
	Moderately know  
		\>\>knowwhatarousesyou \= 2  
	Slightly know  
		\>\>knowwhatarousesyou \= 1  
	Slightly don't know  
		\>\>knowwhatarousesyou \= \-1  
	Moderately don't know  
		\>\>knowwhatarousesyou \= \-2  
	Fully don't know  
		\>\>knowwhatarousesyou \= \-3

	  
\*question: In general, the most erotic scenarios are:  
	Totally gentle, low-energy  
		\>\>highenergy \= \-3  
	Moderately gentle, low-energy  
		\>\>highenergy \= \-2  
	Slightly gentle, low-energy  
		\>\>highenergy \= \-1  
	Equally gentle and intense  
		\>\>highenergy \= 0  
	Slightly intense, high-energy  
		\>\>highenergy \= 1  
	Moderately intense, high-energy  
		\>\>highenergy \= 2  
	Totally intense, high-energy  
		\>\>highenergy \= \-3

	  
\*question: "I find cunnilingus:"  
	\*tip: "oral sex on female genitalia"  
	\*answers: vanillaarousalScale  
	\*save: cunnilingus  
	  
\*question: "I find blowjobs:"  
	\*tip: "oral sex on male genitalia"  
	\*answers: vanillaarousalScale  
	\*save: blowjobs  
	  
\*question: "I find dirtytalking erotic"  
	\*tip: Saying sexual things to each other, usually during sex  
	\*answers: vanillaarousalScale  
	\*save:dirtytalk  
	  
\*question: "I find anal sex (with a penis or penile toy):"  
	\*answers: arousalScale  
	\*save: analsex

\*question: "I find personal freeuse dynamics, arrangements where one partner can sexually "use" the other without asking or negotiating, to be erotic"  
	\*answers: agreementScale  
	\*save:freeuse2  
\--removed autogynephilia qestions 12:21am 5/17/25	  
\--\*question: "I find the thought of existing (in \*nonsexual\* situations) as a biological \*female\* to be erotic"  
\--	\*tip: e.g., joining a knitting group, menstruating, or grocery shopping  
\--	\*answers: agreementScale

\--\*question: "I find the thought of masturbating alone as a biological female, to be erotic"  
\--	\*tip: Where \*you\* are the biological female  
\--	\*answers: agreementScale

\--\*question: "I find the thought of existing (in \*nonsexual\* situations) as a biological \*male\* to be erotic"  
\--	\*tip: e.g., joining a woodworking group, shaving a beard, or grocery shopping  
\--	\*answers: agreementScale

\--\*question: "I find the thought of masturbating alone as a biological male, to be erotic"  
\--	\*tip: Where \*you\* are the biological male  
\--	\*answers: agreementScale  
\--added blanchard questions like.... maybe late march 2025?  
\*if:biomale=1   
	\*question: When I picture myself as having a nude female body, I find this:  
		\*tip: Where \*your own\* body is that of a nude female  
		\*answers: arousalScale  
		\*save:blanchard1m  
		  
	\*if:blanchard1m \> 1  
		\*question: When I picture my own nude female breasts, buttocks, legs, or genitals, I find this:  
			\*answers:arousalScale  
			\*save:blanchard2m  
		  
		\*question:The thought of someone else admiring me while I am a woman in the nude is:  
			\*answers:arousalScale  
			\*save:blanchard3m

\*if:biomale=0   
	\*question: When I picture myself with a nude male body, I find this:  
		\*tip: Where \*your own\* body is that of a nude male  
		\*answers: arousalScale  
		\*save:blanchard1f  
		  
	\*if:blanchard1f \> 1  
		\*question: When I picture my own nude male buttocks, legs, or genitals, I find this:  
			\*answers:arousalScale  
			\*save:blanchard2f  
		  
		\*question:The thought of someone else admiring me while I am a man in the nude is:  
			\*answers:arousalScale  
			\*save:blanchard3f  
	

\*question: "I find vaginal sex (with a penis or penile-toy) to be:"  
	\*answers: vanillaarousalScale  
	\*save:normalsex

		  
\*question: If you tried very hard, could you stop being aroused by something you're into?  
	\*tip: For example, could you "get rid" of a fetish or preference through sheer effort?  
	With little effort, yes  
		\>\>stoparousal \= 3  
	With some effort, yes  
		\>\>stoparousal \= 2  
	With a lot of effort, yes  
		\>\>stoparousal \= 1  
	With an extreme amount of effort, maybe  
		\>\>stoparousal \= 0  
	Impossible  
		\>\>stoparousal \= \-1

	  
\*question: Do you feel as though you've "induced" new fetishes into yourself through the use of porn or erotic content, that otherwise would not have existed for you?  
	\*tip: If multiple apply, select the lowest on the list  
	I don't really have fetishes  
	No  
		\>\> inducefetish \= 0	  
	Yes: Variations on my current preexisting fetishes  
		\>\> inducefetish \= 1  
	Yes: New but still similar to my preexisting fetishes  
		\>\> inducefetish \= 2  
	Yes: New and totally different to my preexisting fetishes  
		\>\> inducefetish \= 3  
	  
\*if: binarygender \= 1  
	\*question: Your preferred breast size in a partner is:  
		Flat  
			\>\> boobsize \= 0  
		Small  
			\>\> boobsize \= 1  
		Small-medium  
			\>\> boobsize \= 2  
		Medium  
			\>\> boobsize \= 3  
		Medium-big  
			\>\> boobsize \= 4  
		Big  
			\>\> boobsize \= 5  
		Gigantic  
			\>\> boobsize \= 6

	  
\*question: Which of the following sexual positions do you find significantly erotic?  
	\*tip: as in, having sex in these positions  
	\*type: checkbox	  
	69  
	Cowgirl  
	Doggystyle  
	Missionary  
	Reverse Cowgirl  
	Spooning  
	Standing up

\--fixed 'asstomouth/rimming' to just 'rimming' on 9/20/2023	  
\*question: Which of the following sex acts do you find significantly erotic?  
	\*tip: Reminder: Assume you're answering for scenarios that involve your preferred gender; if you prefer men, then imagine the 'ass to mouth' question is about a man	  
	\*type: checkbox  
	Anal fingering  
	Rimming  
	Creampies (ejaculating into a vagina)  
	Facefucking  
	Facesitting  
	Facials (ejaculating onto a face)  
	Fingering mouths  
	Fisting (vaginas)  
	Fisting (anuses)  
	Hair pulling  
	Handjobs  
	Pegging  
	Spanking  
	Squirting  
	Vaginal fingering  
	\*save: sexacts

	  
SECTION 3

\*settings  
	\*back: yes  
\*Part 5/5\*  
There's a lot of fetishes out there\! To narrow them down, here's a list of things you might be into. Check any that you're \*definitely\* into. Do not check things that "might be kinda hot in the right circumstances".  
\*button: Understood\!

\*question: Common things: Check all the following categories that contain a thing that arouses you.  
	\*tip: The things in the parentheses are just examples, but there's lots more that can fit into the categories\! You might be into something that fits into a category but isn't described in the examples.  
	\*type: checkbox  
	Appearance states: static (tattoos, bodymods, skinniness, etc.)  
	Body parts: normal, non-genital (elbows, knees, armpits, head hair, etc.)  
	Bondage (gags, shibari, handcuffs, etc.)  
	Clothing (latex, shoes, too-small, miniskirts, cameltoe, etc.)  
	Eagerness (begging, worshipping, teasing, etc.)  
	Exhibitionism/voyeurism (peeping tom, flashing, public sex, etc.)  
	Gentleness (caretaking, healing, tantra, etc.)  
	Humiliation (defilement, impotence, cuckoldry, ridicule, etc.)  
	Incest (cousins, parent/child, etc.)  
	Multiple partners (hotwifing, gangbangs, freeuse, threesomes, etc.)  
	Mythical/fictional creatures (dragons, vampires, aliens, MLP, etc.)  
	Nonconsent (rapeplay, body control, kidnapping, etc.)  
	Power dynamics & D/s (obedience, findom, petplay, choking, etc.)  
	Roles (secretary, asians, catgirls, teachers, stoners, etc.)  
	Sadomasochism (spanking, needle play, clamps, torture, etc.)  
	Sensory (electricity, vacuums, ASMR, tickling, etc.)  
	Toys (anal beads, pussy pumps, showerheads, etc.)  
	\*save: fetish1  
	

\*question: Uncommon things: Check all the following categories that contain a thing that arouses you.  
	\*tip: The things in the parentheses are just examples, but there's lots more that can fit into the categories\! You might be into something that fits into a category but isn't described in the examples.  
	\*type: checkbox  
	Abnormal bodies and body parts (massive bellies, tails/horns, giants, etc.)  
	Age: nonstandard (age gaps, ageplay, unusual ages, etc.)  
	Bestiality/creatures (dogs, horses, dolphins, insects, squid, etc.)  
	Bodily secretions (farts, squirt, urine, blood, etc.)  
	Brutal/violent (gore, mutilation, amputations, drowning, etc.)  
	Creepy/horror (zombies, necrophilia, live insertions, etc.)  
	Dirtiness/disgust/messiness (cakesitting, STDs, soiling, etc.)  
	Genderplay (sissification, futa, crossdressing, etc.)  
	Mental Alteration (hypnotism/mind control, amnesia, cocaine, etc.)  
	Objects: nonstandard (hairbrushes, rope, cars, etc.)  
	Reproduction (pregnancy, surrogacy, oviposition, etc.)  
	Transformations (growth/shrinking, bodyswapping, furries, etc.)  
	Vore (consuming/being consumed, usually whole)  
	\*save: fetish2

\*if: not "Abnormal bodies and body parts (massive bellies, tails/horns, giants, etc.)" in fetish2  
	\>\>abnormalbodyanswers.add(0)  
\*if: not "Age: nonstandard (age gaps, ageplay, unusual ages, etc.)" in fetish2  
	\>\>ageanswers.add(0)  
\*if: not "Bestiality/creatures (dogs, horses, dolphins, insects, squid, etc.)" in fetish2  
	\>\>bestanswers.add(0)  
\*if: not "Bodily secretions (farts, squirt, urine, blood, etc.)" in fetish2  
	\>\>secretionanswers.add(0)  
\*if: not "Brutal/violent (gore, mutilation, amputations, drowning, etc.)" in fetish2  
	\>\>brutalanswers.add(0)  
\*if: not "Creepy/horror (zombies, necrophilia, live insertions, etc.)" in fetish2  
	\>\>creepanswers.add(0)  
\*if: not "Dirtiness/disgust/messiness (cakesitting, STDs, soiling, etc.)" in fetish2  
	\>\>dirtyanswers.add(0)  
\*if: not "Genderplay (sissification, futa, crossdressing, etc.)" in fetish2  
	\>\>genderanswers.add(0)  
\*if: not "Mental Alteration (hypnotism/mind control, amnesia, cocaine, etc.)" in fetish2  
	\>\>malteranswers.add(0)  
\*if: not "Objects: nonstandard (hairbrushes, rope, cars, etc.)" in fetish2  
	\>\>objectanswers.add(0)  
\*if: not "Reproduction (pregnancy, surrogacy, oviposition, etc.)" in fetish2  
	\>\>reproduceanswers.add(0)  
\*if: not "Transformations (growth/shrinking, bodyswapping, furries, etc.)" in fetish2  
	\>\>transformanswers.add(0)  
\*if: not "Vore (consuming/being consumed, usually whole)" in fetish2  
	\>\>voreanswers.add(0)

\*if: not "Appearance states: static (tattoos, bodymods, skinniness, etc.)" in fetish1  
	\>\>appearanceanswers.add(0)  
\*if: not "Body parts: normal, non-genital (elbows, knees, armpits, head hair, etc.)" in fetish1  
	\>\>normalbodyanswers.add(0)  
\*if: not "Bondage (gags, shibari, handcuffs, etc.)" in fetish1  
	\>\>bondageanswers.add(0)  
\*if: not "Clothing (latex, shoes, too-small, miniskirts, cameltoe, etc.)" in fetish1  
	\>\>clothinganswers.add(0)  
\*if: not "Eagerness (begging, worshipping, teasing, etc.)" in fetish1  
	\>\>eageranswers.add(0)  
\*if: not "Exhibitionism/voyeurism (peeping tom, flashing, public sex, etc.)" in fetish1  
	\>\>exhibitionanswers.add(0)  
\*if: not "Gentleness (caretaking, healing, tantra, etc.)" in fetish1  
	\>\>gentleanswers.add(0)  
\*if: not "Humiliation (defilement, impotence, cuckoldry, ridicule, etc.)" in fetish1  
	\>\>humiliateanswers.add(0)  
\*if: not "Incest (cousins, parent/child, etc.)" in fetish1  
	\>\>incestanswers.add(0)  
\*if: not "Multiple partners (hotwifing, gangbangs, freeuse, threesomes, etc.)" in fetish1  
	\>\>multipleanswers.add(0)  
\*if: not "Mythical/fictional creatures (dragons, vampires, aliens, MLP, etc.)" in fetish1  
	\>\>mythicanswers.add(0)  
\*if: not "Nonconsent (rapeplay, body control, kidnapping, etc.)" in fetish1  
	\>\>nonconanswers.add(0)  
\*if: not "Power dynamics & D/s (obedience, findom, petplay, choking, etc.)" in fetish1  
	\>\>poweranswers.add(0)  
\*if: not "Roles (secretary, asians, catgirls, teachers, stoners, etc.)" in fetish1  
	\>\>roleanswers.add(0)  
\*if: not "Sadomasochism (spanking, needle play, clamps, torture, etc.)" in fetish1  
	\>\>sadoanswers.add(0)  
\*if: not "Sensory (electricity, vacuums, ASMR, tickling, etc.)" in fetish1  
	\>\>sensoryanswers.add(0)  
\*if: not "Toys (anal beads, pussy pumps, showerheads, etc.)" in fetish1  
	\>\>toyanswers.add(0)

\>\>arousalScale \= \[\["Not arousing", 0\], \["Slightly arousing", 1\], \["Somewhat arousing", 2\], \["Moderately arousing", 3\], \["Very arousing", 5\], \["Extremely arousing", 8\]\]

\*if: "Age: nonstandard (age gaps, ageplay, unusual ages, etc.)" in fetish2	  
	\*question: "I find age-related things (beyond "normal" stuff like being attracted to people your own age) to be:"  
		\*tip: If you find one specific type of age stuff to be erotic (for example, age gaps, ageplay, unusual ages, etc.), then answer with just that in mind, not the whole category.  
		\*answers: arousalScale  
		\*save: age

	\*if: age \> 0  
		\*question: How old were you when you first experienced interest in age-related sexual interests?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>agefetishstart \= 4  
			5-6yo  
				\>\>agefetishstart \= 5  
			7-8yo  
				\>\>agefetishstart \= 7  
			9-10yo  
				\>\>agefetishstart \= 9  
			11-12yo  
				\>\>agefetishstart \= 11  
			13-14yo  
				\>\>agefetishstart \= 13  
			15-16yo  
				\>\>agefetishstart \= 15  
			17-18yo  
				\>\>agefetishstart \= 17  
			19-25yo  
				\>\>agefetishstart \= 19  
			26yo+  
				\>\>agefetishstart \= 27  
				  
		\*question: I find age gaps to be:  
			\*tip: If you are attracted to people much younger or older than yourself, this also counts  
			\*answers: arousalScale  
			\*save: agegap  
			  
		\*if: agegap \> 1  
			\*question: In erotic scenarios involving age gaps, I prefer to be \_\_\_\_  
				Older  
					\*question: "I find older children who have not yet reached sexual maturity (e.g., age 8\) to be:"  
						\*tip: Reminder: Experiencing sexual arousal to a fantasy does /not/ mean you would act in a way that harms others in real life, this question is not asking if you would act in a way that harms others.  
						\*answers: arousalScale  
						\*save: pedophilia  
	\--changed the pedophilia gate from \>1 to \>0 on 10:04pm 1/1/25  
					\*if: pedophilia \> 0  
						\*question: In your fantasies involving children, the children typically \_\_\_ the experience  
							\*tip: Reminder: Experiencing sexual arousal to a fantasy does /not/ mean you would act in a way that harms others in real life, this question is not asking if you would act in a way that harms others.  
							Totally enjoy  
								\>\>Childrenenjoy \= 3  
							Moderately enjoy  
								\>\>Childrenenjoy \= 2  
							Slightly enjoy  
								\>\>Childrenenjoy \= 1  
							Equally enjoy/do not enjoy  
								\>\>Childrenenjoy \= 0  
							Slightly do not enjoy  
								\>\>Childrenenjoy \= \-1  
							Moderately do not enjoy  
								\>\>Childrenenjoy \= \-2  
							Totally do not enjoy  
								\>\>Childrenenjoy \= \-3  
							  
						\*question: In general, consuming erotic content about children feels like it would \_\_\_\_ my likelihood of acting on this in real life  
							Significantly reduce  
								\>\>childpornincreaserisk \= \-3  
							Moderately reduce  
								\>\>childpornincreaserisk \= \-2  
							Slightly reduce  
								\>\>childpornincreaserisk \= \-1  
							Have no effect  
								\>\>childpornincreaserisk \= 0  
							Slightly increase  
								\>\>childpornincreaserisk \= 1  
							Moderately increase  
								\>\>childpornincreaserisk \= 2  
							Significantly increase  
								\>\>childpornincreaserisk \= 3  
								  
						\*question: Do you consume erotic content about prepubescent children? This can include victimless content, such as erotic stories or animations.  
							No  
								\>\>cpwatch=0  
							Yes, rarely  
								\>\>cpwatch=1  
							Yes, sometimes  
								\>\>cpwatch=2  
							Yes, often  
								\>\>cpwatch=3

						\--removed 'skip this question' option at 9:08pm 1/1/25  
						\*question: Have you ever had sexual contact with a child?   
							\*tip: Not including child-on-child sexual experiences \- only when you were older.  
							Skip this question  
								\>\>offendingpedo=0  
							No  
								\>\>offendingpedo=1  
							Yes, slightly  
								\>\>offendingpedo=2  
							Yes, moderately  
								\>\>offendingpedo=3								  
							Yes, a lot  
								\>\>offendingpedo=4

					\*question: "I find toddlers or babies to be:"  
						\*tip: Reminder: Experiencing sexual arousal to a fantasy does /not/ mean you would act in a way that harms others in real life, this question is not asking if you would act in a way that harms others.  
						\*answers: arousalScale  
						\*save: pedophilia2  
						

				Younger  
					\*question: "I find the thought of /being/ a child who have not yet reached sexual maturity to be:"  
						\*tip: Reminder: Experiencing sexual arousal does /not/ mean you would act in a way that harms others, this question is not asking if you would act in a way that harms others.  
						\*answers: arousalScale  
					

	  
			  
						

		\*question: "I find mature people (e.g., age 60+) to be:"  
			\*answers: arousalScale  
			\*save:older  
		  
		\*question: "I find scenarios involving age progression to be:"  
			\*tip: Typically involving someone aging, usually rapidly  
			\*answers: arousalScale  
			\*save: progression  
			  
		\*question: "I find scenarios involving age regression to be:"  
			\*tip: Typically involving someone deaging, usually rapidly  
			\*answers: arousalScale  
			\*save: regression  
		  
		\*question: "I find CGL (caregiver/little) dynamics to be:"  
			\*tip: "A dynamic where a partner takes on a caregiver role towards their "little", usually associated with age roleplay  
			\*answers: arousalScale  
			\*save: cgl

	  
\*if: "Appearance states: static (tattoos, bodymods, skinniness, etc.)" in fetish1			  
	\*question: "I find sexual scenarios a specific state of appearance to be:"  
		\*tip: If you find one specific type of appearance to be erotic (for example, tattoos, implants, skinniness, etc.), then answer with just that in mind, not the whole category.  
		\*answers: arousalScale  
		\*save: appearance

	\*if: appearance \> 0  
		\*question: How old were you when you first experienced interest in your appearance-based sexual interests?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>appearancefetishstart \= 4  
			5-6yo  
				\>\>appearancefetishstart \= 5  
			7-8yo  
				\>\>appearancefetishstart \= 7  
			9-10yo  
				\>\>appearancefetishstart \= 9  
			11-12yo  
				\>\>appearancefetishstart \= 11  
			13-14yo  
				\>\>appearancefetishstart \= 13  
			15-16yo  
				\>\>appearancefetishstart \= 15  
			17-18yo  
				\>\>appearancefetishstart \= 17  
			19-25yo  
				\>\>appearancefetishstart \= 19  
			26yo+  
				\>\>appearancefetishstart \= 27  
				  
		\*question: Which of the following body weights do you find most erotic?  
			\*tip: Just the body states, not the process of getting there  
			Very skinny  
			Slightly skinny  
			Average  
			Slightly chubby  
			Overweight  
			Obese

	  
		\*question: Which of the following body modifications do you find significantly erotic?  
			\*type: checkbox  
			Tattoos (light)  
			Tattoos (heavy)  
			Breast implants  
			Penile implants  
			Genital piercings  
			Nipple piercings  
			Facial piercings  
			Split tongues  
			Scarification  
			Gauges  
			Other  
			\*save: bodymod

		\*question: Which of the following body types do you find significantly erotic?  
			\*type: checkbox  
			Very tall people  
			Very short people  
			Very flexible people  
			Hermaphrodites  
			Ugly people  
			Deformed people  
			\*save: bodytypes

\*if: "Bestiality/creatures (dogs, horses, dolphins, insects, squid, etc.)" in fetish2  
	\*question: "I find bestiality, or sexual interaction with at least one non-human animals/amphibians/insects/birds/etc, to be:"  
		\*tip: This question is not about \*being\* an animal; there's a section for that later. It's also \*not\* including fantasy creatures, strictly about real creatures\!  
		\*answers: arousalScale  
		\*save: bestiality

		  
	\*if: bestiality \> 0  
		\*question: How old were you when you first experienced interest in bestiality/creatures-related sexual interests?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>bestialityfetishstart \= 4  
			5-6yo  
				\>\>bestialityfetishstart \= 5  
			7-8yo  
				\>\>bestialityfetishstart \= 7  
			9-10yo  
				\>\>bestialityfetishstart \= 9  
			11-12yo  
				\>\>bestialityfetishstart \= 11  
			13-14yo  
				\>\>bestialityfetishstart \= 13  
			15-16yo  
				\>\>bestialityfetishstart \= 15  
			17-18yo  
				\>\>bestialityfetishstart \= 17  
			19-25yo  
				\>\>bestialityfetishstart \= 19  
			26yo+  
				\>\>bestialityfetishstart \= 27  
				  
		\*question: "I find penetrating my preferred animal/creature to be:"  
			\*answers: arousalScale  
			\*save:penetration  
		  
		\*question: "I find being penetrated by my preferred animal/creature to be:"  
			\*answers: arousalScale  
			\*save:penetration2  
	  
		\*question: "I find receiving oral sex with my preferred animal/creature to be:"  
			\*answers: arousalScale  
			\*save:oralsexanimal  
		  
		\*question: "I find giving oral sex to my preferred animal/creature to be:"  
			\*answers: arousalScale  
			\*save:oralsexanimal2  
		  
		\*question: When it comes to bestiality, which of the following creatures do you find erotic?  
			\*type: checkbox  
			Dogs  
			Cats  
			Goats  
			Sheep  
			Pigs  
			Monkeys  
			Bears  
			Lions  
			Horses  
			More not listed here  
			\*save: animals  
		\*if: animals.size \= 0  
			\*goto: animalsnext  
		\*if: animals.size \> 1  
			\*question: Of these options, which one is the most erotic?  
				\*answers: animals  
				\*save: animalsmost  
		\*if: animals.size \= 1  
			\>\>animalssmost \= animals\[1\]  
		\>\>Totalanimals \= animals.size  
		\*label: animalsnext  
		\>\>Total \= animals.size	

		\*if: "Dogs" in animals  
			\>\>bestanswers.add(bestiality\*788)  
		\*if: "Cats" in animals  
			\>\>bestanswers.add(bestiality\*762)  
		\*if: "Goats" in animals  
			\>\>bestanswers.add(bestiality\*794)  
		\*if: "Sheep" in animals  
			\>\>bestanswers.add(bestiality\*794)  
		\*if: "Pigs" in animals  
			\>\>bestanswers.add(bestiality\*789)  
		\*if: "Monkeys" in animals  
			\>\>bestanswers.add(bestiality\*786)  
		\*if: "Bears" in animals  
			\>\>bestanswers.add(bestiality\*715)  
		\*if: "Lions" in animals  
			\>\>bestanswers.add(bestiality\*715)  
		\*if: "Horses" in animals  
			\>\>bestanswers.add(bestiality\*729)  
	  
		\*if: "More not listed here" in animals  
			\*question: When it comes to bestiality, which of the following creatures do you find erotic?  
				\*type: checkbox  
				Octopi/squid  
				Parasites/leeches  
				Fish/sharks  
				Insects/arachnids  
				Amphibians  
				Dolphins/whales  
				Birds  
				Slugs/snails/worms  
				Reptiles  
				Foxes  
				Rodents  
				More/other  
				\*save: animals2  
			\*if: animals2.size \= 0  
				\*goto: animals2next  
			\*if: animals2.size \> 1  
				\*question: Of these options, which one is the most erotic?  
					\*answers: animals2  
					\*save: animals2most  
			\*if: animals2.size \= 1  
				\>\>animals2smost \= animals2\[1\]  
			\>\>Totalanimals2 \= animals2.size  
			\*label: animals2next  
			\>\>Total \= animals2.size	  
			  
			\*if: "Octopi/squid" in animals2  
				\>\>bestanswers.add(bestiality\*620)  
			\*if: "Parasites/leeches" in animals2  
				\>\>bestanswers.add(bestiality\*734)  
			\*if: "Fish/sharks" in animals2  
				\>\>bestanswers.add(bestiality\*713)  
			\*if: "Insects/arachnids" in animals2  
				\>\>bestanswers.add(bestiality\*706)  
			\*if: "Amphibians" in animals2  
				\>\>bestanswers.add(bestiality\*728)  
			\*if: "Reptiles" in animals2  
				\>\>bestanswers.add(bestiality\*728)  
			\*if: "Insects/arachnids" in animals2  
				\>\>bestanswers.add(bestiality\*706)  
			\*if: "Dolphins/whales" in animals2  
				\>\>bestanswers.add(bestiality\*718)  
			\*if: "Slugs/snails/worms" in animals2  
				\>\>bestanswers.add(bestiality\*733)			  
			\*if: "Dolphins/whales" in animals2  
				\>\>bestanswers.add(bestiality\*718)			

\*if: "Bodily secretions (farts, squirt, urine, blood, etc.)" in fetish2  
	\*question: "I find bodily secretions to be:"  
		\*tip: If you find one specific type of secretion to be erotic (for example, urine or farts), then answer with just that in mind, not the whole category.  
		\*answers: arousalScale  
		\*save: secretions

	\*if: secretions \> 0		  
		\*question: How old were you when you first experienced sexual interest in bodily-secretions?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>secretionfetishstart \= 4  
			5-6yo  
				\>\>secretionfetishstart \= 5  
			7-8yo  
				\>\>secretionfetishstart \= 7  
			9-10yo  
				\>\>secretionfetishstart \= 9  
			11-12yo  
				\>\>secretionfetishstart \= 11  
			13-14yo  
				\>\>secretionfetishstart \= 13  
			15-16yo  
				\>\>secretionfetishstart \= 15  
			17-18yo  
				\>\>secretionfetishstart \= 17  
			19-25yo  
				\>\>secretionfetishstart \= 19  
			26yo+  
				\>\>secretionfetishstart \= 27  
		

		\*question: Which of the following bodily secretions do you find erotic?  
			\*tip: Assume in an erotic context; for example, if you enjoy getting peed on, then answer 'yes' for urine, even if you don't find urine erotic in other contexts  
			\*type: checkbox  
			Belches  
			Blood (normal)  
			Blood (menstrual)  
			Breast milk  
			Cum (male ejaculate)  
			Farts  
			Precum  
			Saliva  
			Scat (poop)  
			Smegma  
			Squirt  
			Sweat  
			Urine  
			Vomit  
			\*save: secretionscollection  
		\*if: secretionscollection.size \= 0  
			\*goto: secretionsnext  
		\*if: secretionscollection.size \> 1  
			\*question: Of these options, which one is the most erotic?  
				\*answers: secretionscollection  
				\*save: secretions2most

			  
		\*if: "Blood (normal)" in secretionscollection  
			\*question: For blood (normal), which of the following do you find erotic?  
				\*type: checkbox  
				Consuming it myself  
				Others consuming it  
				Bleeding myself  
				Others bleeding  
				Playing with it myself (e.g., smearing)  
				Others playing with it (e.g., smearing)  
				Putting blood into my orifices  
				Putting blood into others' orifices  
				Huge amounts of blood  
				Unusual blood (e.g., coloring, thickness)  
						  
		\*if: "Blood (menstrual)" in secretionscollection  
			\*question: For blood (menstrual), which of the following do you find erotic?  
				\*type: checkbox  
				Consuming it myself  
				Others consuming it  
				Bleeding myself  
				Others bleeding  
				Playing with it myself (e.g., smearing)  
				Others playing with it (e.g., smearing)  
				Putting menstrual blood into my orifices  
				Putting menstrual blood into others' orifices  
				Huge amounts of menstrual blood  
				Unusual blood (e.g., coloring, thickness)  
						  
		\*if: "Breast milk" in secretionscollection  
			\*question: For breast milk, which of the following do you find erotic?  
				\*type: checkbox  
				Consuming it myself  
				Others consuming it  
				Lactating myself  
				Others lactating  
				Playing with it myself (e.g., smearing)  
				Others playing with it (e.g., smearing)  
				Putting breast milk into my orifices  
				Putting breast milk into others' orifices  
				Huge amounts of breast milk  
				Unusual milk (e.g., coloring, thickness)  
				  
		\*if: "Cum (male ejaculate)" in secretionscollection  
			\*question: For male ejaculate, which of the following do you find erotic?  
				\*type: checkbox  
				Consuming it myself  
				Others consuming it  
				Ejaculating myself  
				Others ejaculating  
				Playing with it myself (e.g., smearing)  
				Others playing with it (e.g., smearing)  
				Putting ejaculate into my orifices  
				Putting ejaculate into others' orifices  
				Huge amounts of ejaculate  
				Unusual ejaculate (e.g., coloring, thickness)

		\*if: "Precum" in secretionscollection  
			\*question: For precum, which of the following do you find erotic?  
				\*type: checkbox  
				Consuming it myself  
				Others consuming it  
				Making precum myself  
				Others making precum  
				Playing with it myself (e.g., smearing)  
				Others playing with it (e.g., smearing)  
				Putting precum into my orifices  
				Putting precum into others' orifices  
				Huge amounts of precum  
				Unusual precum (e.g., coloring, thickness)

		\*if: "Saliva" in secretionscollection  
			\*question: For saliva, which of the following do you find erotic?  
				\*type: checkbox  
				Consuming it myself  
				Others consuming it  
				Making saliva myself  
				Others making saliva  
				Playing with it myself (e.g., smearing)  
				Others playing with it (e.g., smearing)  
				Putting saliva into my orifices  
				Putting saliva into others' orifices  
				Huge amounts of saliva  
				Unusual saliva (e.g., coloring, thickness)

		\*if: "Scat (poop)" in secretionscollection  
			\*question: For scat (poop), which of the following do you find erotic?  
				\*type: checkbox  
				Consuming it myself  
				Others consuming it  
				Making scat myself  
				Others making scat  
				Playing with it myself (e.g., smearing)  
				Others playing with it (e.g., smearing)  
				Putting scat into my orifices  
				Putting scat into others' orifices  
				Huge amounts of scat  
				Unusual scat (e.g., coloring, thickness)

		\*if: "Smegma" in secretionscollection  
			\*question: For smegma, which of the following do you find erotic?  
				\*type: checkbox  
				Consuming it myself  
				Others consuming it  
				Making smegma myself  
				Others making smegma  
				Playing with it myself (e.g., smearing)  
				Others playing with it (e.g., smearing)  
				Putting smegma into my orifices  
				Putting smegma into others' orifices  
				Huge amounts of smegma  
				Unusual smegma (e.g., coloring, thickness)

		\*if:"Squirt" in secretionscollection  
			\*question: For squirt, which of the following do you find erotic?  
				\*type: checkbox  
				Consuming it myself  
				Others consuming it  
				Squirting myself  
				Others squirting  
				Playing with it myself (e.g., smearing)  
				Others playing with it (e.g., smearing)  
				Putting squirt into my orifices  
				Putting squirt into others' orifices  
				Huge amounts of squirt  
				Unusual squirt (e.g., coloring, thickness)

		\*if: "Sweat" in secretionscollection  
			\*question: For sweat, which of the following do you find erotic?  
				\*type: checkbox  
				Consuming it myself  
				Others consuming it  
				Sweating myself  
				Others sweating  
				Playing with it myself (e.g., smearing)  
				Others playing with it (e.g., smearing)  
				Putting sweat into my orifices  
				Putting sweat into others' orifices  
				Huge amounts of sweat  
				Unusual sweat (e.g., coloring, thickness)

		\*if: "Urine" in secretionscollection  
			\*question: For urine, which of the following do you find erotic?  
				\*type: checkbox  
				Consuming it myself  
				Others consuming it  
				Urinating myself  
				Others urinating  
				Playing with it myself (e.g., smearing)  
				Others playing with it (e.g., smearing)  
				Putting urine into my orifices  
				Putting urine into others' orifices  
				Huge amounts of urine  
				Unusual urine (e.g., coloring, thickness)

		\*if: "Vomit" in secretionscollection  
			\*question: For vomit, which of the following do you find erotic?  
				\*type: checkbox  
				Consuming it myself  
				Others consuming it  
				Vomiting myself  
				Others vomiting  
				Playing with it myself (e.g., smearing)  
				Others playing with it (e.g., smearing)  
				Putting vomit into my orifices  
				Putting vomit into others' orifices  
				Huge amounts of vomit  
				Unusual vomit (e.g., coloring, thickness)

\*if: "Abnormal bodies and body parts (massive bellies, tails/horns, giants, etc.)" in fetish2  
	\*question: "I find abnormal body parts to be:"  
		\*tip: If you find one specific abnormal body part to be erotic (for example, giants or toothless people), then answer with just that in mind, not the whole category.  
		\*answers: arousalScale  
		\*save: abnormalbody

	\*if: abnormalbody \> 0  
		\*question: How old were you when you first experienced interest in abnormal body/body part-related things?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>abnormalbfetishstart \= 4  
			5-6yo  
				\>\>abnormalbfetishstart \= 5  
			7-8yo  
				\>\>abnormalbfetishstart \= 7  
			9-10yo  
				\>\>abnormalbfetishstart \= 9  
			11-12yo  
				\>\>abnormalbfetishstart \= 11  
			13-14yo  
				\>\>abnormalbfetishstart \= 13  
			15-16yo  
				\>\>abnormalbfetishstart \= 15  
			17-18yo  
				\>\>abnormalbfetishstart \= 17  
			19-25yo  
				\>\>abnormalbfetishstart \= 19  
			26yo+  
				\>\>abnormalbfetishstart \= 27  
				  
		\*question: For Which of the following categories of abnormal body states do you find erotic?  
			\*type: checkbox  
			Oversized/giant body parts  
			Extremely huge body parts  
			Extremely small body parts  
			Very short people (e.g., dwarves)  
			Tiny people (e.g., fairies)  
			Very tall people (e.g., tall as a tree)  
			Massively giant people (e.g. skyscraper tall)  
			More sexual body parts (e.g. 3 breasts, 2 penises)  
			Very excessive body hair  
			Toothlessness  
			Slime/goo people  
			Impossibly severe obesity  
			Wings  
			Horns  
			Fangs  
			Tails  
			Udders  
			Animal body parts  
			\*save: bodypartsabnormal

		\*if: "Oversized/giant body parts" in bodypartsabnormal  
			\*question: Which body parts are most erotic when giant/oversized?  
				\*type: checkbox  
				Facial features  
				Tongue  
				Breasts  
				Nipples  
				Belly  
				Hips  
				Butt  
				Vagina  
				Clitoris  
				Penis  
				Testicles  
				Anus  
				Legs  
				Feet  
				Arms  
				Hands

		\*if: "Extremely huge body parts" in bodypartsabnormal  
			\*question: Which body parts are most erotic when extremely huge?  
				\*type: checkbox  
				Facial features  
				Tongue  
				Breasts  
				Nipples  
				Belly  
				Hips  
				Butt  
				Vagina  
				Clitoris  
				Penis  
				Testicles  
				Anus  
				Legs  
				Feet  
				Arms  
				Hands  
			  
		\*if: "Extremely small body parts" in bodypartsabnormal  
			\*question: Which body parts are most erotic when extremely small?  
				\*type: checkbox  
				Facial features  
				Tongue  
				Breasts  
				Nipples  
				Belly  
				Hips  
				Butt  
				Vagina  
				Clitoris  
				Penis  
				Testicles  
				Anus  
				Legs  
				Feet  
				Arms  
				Hands  
			  
		  
		\*question: "I find genderswapped body parts to be:"  
			\*tip: If you find one specific genderswapped body part to be erotic (for example, men with breasts or women with penises), then answer with just that in mind, not the whole category.  
			\*answers:arousalScale  
			\*save:genderswapped  
			  
		\*if: genderswapped \> 1  
			\*question: For Which of the following categories of genderswapped body states do you find erotic?  
				\*type: checkbox  
				Men with breasts  
				Men with a vagina  
				Men with both a penis and vagina  
				Women with a penis  
				Women without breasts  
				Women with both a penis and a vagina  
				\*save: genderswapelements  
				  
			\*if: "Men with breasts" in genderswapelements  
				\>\>abnormalbodyanswers.add(genderswapped\*314)  
			\*if: "Men with a vagina" in genderswapelements  
				\>\>abnormalbodyanswers.add(genderswapped\*329)  
			\*if: "Men with both a penis and vagina" in genderswapelements  
				\>\>abnormalbodyanswers.add(genderswapped\*363)  
			\*if: "Women with a penis" in genderswapelements  
				\>\>abnormalbodyanswers.add(genderswapped\*273)  
			\*if: "Women without breasts" in genderswapelements  
				\>\>abnormalbodyanswers.add(genderswapped\*166)  
			\*if: "Women with both a penis and a vagina" in genderswapelements  
				\>\>abnormalbodyanswers.add(genderswapped\*320)  
			  
			  
		\*question: "It's most erotic when the altered body is"  
			\*type: slider  
			\*before: Mine  
			\*after: Someone else's

\*if: "Body parts: normal, non-genital (elbows, knees, armpits, head hair, etc.)" in fetish1  
	\*question: Select all body parts you find significantly erotic  
		\*type: checkbox  
		Scalp  
		Hair (head)  
		Hair (pubic)  
		Eyes  
		Nose  
		Ears  
		Lips  
		Teeth  
		Tongue  
		Jawline  
		Neck  
		Shoulders  
		Arms  
		Armpits  
		Hands  
		Fingers  
		Areolas  
		Ribcage  
		Waist  
		Belly  
		Hips  
		Buttocks  
		Pubic mound  
		Thighs  
		Knees  
		Calves  
		Ankles  
		Feet  
		Toes  
		\*save: bodyparts

\--this seems to be broken, deleting 4/22/25  
	  
\--	\*question: "I find {bodypartsmost}:"   
\--		\*answers:arousalScale  
\--		\*save:bodypartwinnerscale  
	

	\*question: How old were you when you first experienced interest in specific body parts (not including standard sexual body parts like breasts or genitals)?  
		\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
		0-4yo  
			\>\>normalbfetishstart \= 4  
		5-6yo  
			\>\>normalbfetishstart \= 5  
		7-8yo  
			\>\>normalbfetishstart \= 7  
		9-10yo  
			\>\>normalbfetishstart \= 9  
		11-12yo  
			\>\>normalbfetishstart \= 11  
		13-14yo  
			\>\>normalbfetishstart \= 13  
		15-16yo  
			\>\>normalbfetishstart \= 15  
		17-18yo  
			\>\>normalbfetishstart \= 17  
		19-25yo  
			\>\>normalbfetishstart \= 19  
		26yo+  
			\>\>normalbfetishstart \= 27

\*if: "Bondage (gags, shibari, handcuffs, etc.)" in fetish1  
	\*question: "I find light bondage to be:"  
		\*tip: For example: fuzzy handcuffs, silk blindfolds  
		\*answers: arousalScale  
		\*save: lightbondage

	\*question: "I find medium bondage to be:"  
		\*answers: arousalScale  
		\*tip: For example: spread-eagle ties, gags  
		\*save: mediumbondage

	\*question: "I find extreme bondage to be:"  
		\*tip: For example: suspension, vacuum beds  
		\*answers: arousalScale  
		\*save:extremebondage

	\*question: In general, I prefer when the person in bondage is  
		Me  
		Someone else

	\*question: Which of the following do you find to be erotic?  
		\*type:checkbox  
		Blindfolds  
		Butterfly chairs  
		Cages  
		Chains  
		Chastity Belts  
		Face bondage  
		Funnel gags  
		Gags  
		Handcuffs  
		Lacing Tables  
		Leashes/collars  
		Mummification  
		Pony play  
		Punishment ties  
		Shibari  
		St. Andrew's Cross  
		Stocks  
		Suspension  
		Water bondage  
		\*save: bondage

	\*question: How old were you when you first experienced sexual interest in bondage?  
		\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
		0-4yo  
			\>\>bondagefetishstart \= 4  
		5-6yo  
			\>\>bondagefetishstart \= 5  
		7-8yo  
			\>\>bondagefetishstart \= 7  
		9-10yo  
			\>\>bondagefetishstart \= 9  
		11-12yo  
			\>\>bondagefetishstart \= 11  
		13-14yo  
			\>\>bondagefetishstart \= 13  
		15-16yo  
			\>\>bondagefetishstart \= 15  
		17-18yo  
			\>\>bondagefetishstart \= 17  
		19-25yo  
			\>\>bondagefetishstart \= 19  
		26yo+  
			\>\>bondagefetishstart \= 27	  
			

\*if: "Brutal/violent (gore, mutilation, amputations, drowning, etc.)" in fetish2  
	\*question: "I find sexual scenarios involving brutality or violence to be:"  
		\*tip: If you find one specific type of brutality scenario to be erotic (for example, gore, mutilation, drowning, etc.), then answer with just that in mind, not the whole category.	  
		\*answers: arousalScale  
		\*save: brutality

			  
	\*if: brutality \> 0  
		\*question: How old were you when you first experienced interest in brutality-related sexual interests?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>brutalityfetishstart \= 4  
			5-6yo  
				\>\>brutalityfetishstart \= 5  
			7-8yo  
				\>\>brutalityfetishstart \= 7  
			9-10yo  
				\>\>brutalityfetishstart \= 9  
			11-12yo  
				\>\>brutalityfetishstart \= 11  
			13-14yo  
				\>\>brutalityfetishstart \= 13  
			15-16yo  
				\>\>brutalityfetishstart \= 15  
			17-18yo  
				\>\>brutalityfetishstart \= 17  
			19-25yo  
				\>\>brutalityfetishstart \= 19  
			26yo+  
				\>\>brutalityfetishstart \= 27  
				  
		\*question: "I find scenarios in which the receiver does not get any sexual gratification from the pain, to be:"  
			\*answers: arousalScale  
			\*save:gratification

		\*question: "I find scenarios in which a person is faced with a terrible and inevitable future, to be:"  
			\*tip: For example, realizing they are permanently trapped, or about to get sold off into slavery, etc.  
			\*answers: arousalScale  
			\*save:badends

		\*question: Which of the following do you find erotic?  
			\*type: checkbox  
			Amputation  
			Branding  
			Burning (e.g., cigarettes)  
			Crushing (live creatures, e.g. mice)  
			Cutting  
			Drowning  
			Execution  
			Genital mutilation  
			Gore  
			Impalement   
			Infibulation (sewing labia shut)  
			Permanent disfigurement  
			Scarification  
			Snuff  
			Tooth removal  
			Wound fucking  
			\*save: brutal2

\*if: "Clothing (latex, shoes, too-small, miniskirts, cameltoe, etc.)" in fetish1  
	\*question: "I find specific kinds of clothes to be:"  
		\*tip: If you find one specific type of clothing to be erotic (for example, latex, shoes, cameltoe, etc.), then answer with just that in mind, not the whole category.  
		\*answers: arousalScale  
		\*save: clothing

			  
	\*if: clothing \> 0  
		\*question: How old were you when you first experienced interest in clothing related sexual interests?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>clothingfetishstart \= 4  
			5-6yo  
				\>\>clothingfetishstart \= 5  
			7-8yo  
				\>\>clothingfetishstart \= 7  
			9-10yo  
				\>\>clothingfetishstart \= 9  
			11-12yo  
				\>\>clothingfetishstart \= 11  
			13-14yo  
				\>\>clothingfetishstart \= 13  
			15-16yo  
				\>\>clothingfetishstart \= 15  
			17-18yo  
				\>\>clothingfetishstart \= 17  
			19-25yo  
				\>\>clothingfetishstart \= 19  
			26yo+  
				\>\>clothingfetishstart \= 27

		\*question: In general, it's most erotic when \_\_\_\_\_ wears the clothing you find erotic  
			Yourself  
			Other people  
			Both

		\*question: Which of the following do you find erotic?  
			\*type: checkbox  
			Clothing items (shoes, chokers, diapers, etc.)  
			Clothing materials (latex, leather, etc.)  
			Clothing states (cameltoe, malfunctions, etc.)  
			\*save: clothingtype  
				  
		\*if: "Clothing items (shoes, chokers, diapers, etc.)" in clothingtype  
			\*question: Which of the following do you find erotic?  
				\*type: checkbox  
				Animal-esque clothing (e.g., cat ears)  
				Chokers  
				Corsets  
				Boots  
				Bras  
				Briefs  
				Diapers  
				Dresses  
				Fishnets  
				Glasses  
				Gloves  
				Lingerie  
				Miniskirts  
				Panties  
				Pants  
				Shoes (non high heel)  
				Shoes (high heel)  
				Skirts  
				Socks/stockings  
				Suspenders  
				Thongs  
				Other  
				\*save: clothingitems

		\*if: "Clothing materials (latex, leather, etc.)" in clothingtype  
			\*question: Which of the following do you find erotic?  
				\*type: checkbox  
				Fur  
				Silk  
				PVC/vinyl  
				Leather  
				Latex/rubber  
				Denim  
				Chain mail  
				Wetlook  
				Other  
				\*save:clothingmaterial

		\*if: "Clothing states (cameltoe, malfunctions, etc.)" in clothingtype  
			\*question: Which of the following do you find erotic?  
				\*type: checkbox  
				Cameltoe  
				Wardrobe malfunctions  
				Clothing that's too small  
				Clothing that's too big  
				Dirty clothes  
				Clothes stained with bodily fluids  
				Shirtcocking  
				Wedgies  
				Tearing clothing  
				\*save: clothingstate

\*if: "Creepy/horror (zombies, necrophilia, live insertions, etc.)" in fetish2  
	\*question: "I find sexual scenarios involving creepiness and horror to be:"  
		\*tip: If you find one specific type of creepiness/horror scenario to be erotic (for example, zombies, necrophilia, live insertions, etc.), then answer with just that in mind, not the whole category.  
		\*answers: arousalScale  
		\*save: creepy  
	\*if: creepy \= 0

		  
	\*if: creepy \> 0  
		\*question: How old were you when you first experienced interest in creepy/horror related sexual interests?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>creepyfetishstart \= 4  
			5-6yo  
				\>\>creepyfetishstart \= 5  
			7-8yo  
				\>\>creepyfetishstart \= 7  
			9-10yo  
				\>\>creepyfetishstart \= 9  
			11-12yo  
				\>\>creepyfetishstart \= 11  
			13-14yo  
				\>\>creepyfetishstart \= 13  
			15-16yo  
				\>\>creepyfetishstart \= 15  
			17-18yo  
				\>\>creepyfetishstart \= 17  
			19-25yo  
				\>\>creepyfetishstart \= 19  
			26yo+  
				\>\>creepyfetishstart \= 27  
		\*question: Which of the following do you find erotic?  
			\*type: checkbox  
			Cannibalism/meatslaves  
			Necrophilia  
			Creepy characters (e.g., clowns)  
			Scary characters (e.g., monsters)  
			Mental disabilities  
			Physical disabilities  
			Body horror (e.g., human centipede, mutations)  
			Living insertions (live creatures in orifices)  
			Parasites  
			\*save: creep2

		\*if: "Necrophilia" in creep2  
			\*question: When it comes to necrophilia, it's most erotic when your role is:  
				Not the dead body  
				The dead body  
				Both  
			  
			\*question: When it comes to necrophilia, you generally prefer fantasies where the dead body is:  
				Old/rotting  
				New/fresh  
			  
		\*if: "Body horror (e.g., human centipede, mutations)" in creep2  
			\*question: When it comes to body horror, which of the following are erotic?  
				\*type: checkbox  
				Body combinations (joined with another person)  
				Body swaps (e.g. limbs replaced with other things)  
				Disease  
				Decay  
				Destructive pregnancy  
				Extreme plastic surgery  
				Infestations/parasites  
				Malicious surgeries/medical horror  
				Mutations  
				Mutilations  
				\*save:bodyhorror

\*if: "Dirtiness/disgust/messiness (cakesitting, STDs, soiling, etc.)" in fetish2  
	\*question: "I find dirtiness/disgust/messiness to be:"  
		\*tip: If you find one specific dirty scenario to be erotic (for example, being covered in trash), then answer with just that in mind, not the whole category.  
		\*answers: arousalScale  
		\*save: dirty  
	\*if: dirty \= 0  
		  
	\*if: dirty \> 0  
		\*question: How old were you when you first experienced interest in dirtiness related sexual interests?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>dirtyfetishstart \= 4  
			5-6yo  
				\>\>dirtyfetishstart \= 5  
			7-8yo  
				\>\>dirtyfetishstart \= 7  
			9-10yo  
				\>\>dirtyfetishstart \= 9  
			11-12yo  
				\>\>dirtyfetishstart \= 11  
			13-14yo  
				\>\>dirtyfetishstart \= 13  
			15-16yo  
				\>\>dirtyfetishstart \= 15  
			17-18yo  
				\>\>dirtyfetishstart \= 17  
			19-25yo  
				\>\>dirtyfetishstart \= 19  
			26yo+  
				\>\>dirtyfetishstart \= 27  
		\*question: Which of the following disgust-oriented things do you find erotic?  
			\*type: checkbox  
			Bodily fluids (vomit, poop, etc.)  
			Gross insects (maggots, flies, etc.)  
			Dirtiness (trash, rotting, etc.)  
			Dirty locations (alleys, bathrooms, etc.)  
			Disease (STDs, infections, etc.)  
			WAM/sploshing/messiness  
			Salirophilia (someone getting disheviling/soiled)  
			\*save: dirty2  
		\*if: dirty2.size \= 0  
			\*goto: dirty2next  
		\*if: dirty2.size \> 1  
			\*question: Of these options, which one is the most erotic?  
				\*answers: dirty2  
				\*save: dirty2most

	  
		\*if: "WAM/sploshing/messiness" in dirty2  
			\*question: Which of the following messiness do you find erotic?  
				\*type: checkbox  
				Placing messy things inside clothes  
				Liquid food (milk, ketchup, etc.)  
				Normal food (cake, beans, etc.)  
				Lotion/lubricant  
				Mud  
				Paint  
				Oil  
				Shampoo/soap  
				Other

\*if: "Eagerness (begging, worshipping, teasing, etc.)" in fetish1  
	\*question: "I find sexual scenarios involving eagerness to be:"  
		\*tip: If you find one specific type of eagerness to be erotic (for example, worshipping, begging, teasing), then answer with just that in mind, not the whole category.  
		\*answers: arousalScale  
		\*save: eagerness  
		  
	\*if: eagerness \> 0  
		\*question: How old were you when you first experienced interest in eagerness related sexual interests?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>eagerfetishstart \= 4  
			5-6yo  
				\>\>eagerfetishstart \= 5  
			7-8yo  
				\>\>eagerfetishstart \= 7  
			9-10yo  
				\>\>eagerfetishstart \= 9  
			11-12yo  
				\>\>eagerfetishstart \= 11  
			13-14yo  
				\>\>eagerfetishstart \= 13  
			15-16yo  
				\>\>eagerfetishstart \= 15  
			17-18yo  
				\>\>eagerfetishstart \= 17  
			19-25yo  
				\>\>eagerfetishstart \= 19  
			26yo+  
				\>\>eagerfetishstart \= 27  
				  
		\*question: "I find being worshipped to be:"  
			\*tip: General reminder, these questions are asked assuming that you find the other participant to be attractive  
			\*answers: arousalScale  
			\*save:worshipped  
		  
		  
		\*question: "I find worshipping someone else to be:"  
			\*answers: arousalScale  
			\*save: worshipping  
		  
		  
		\*question: "I find teasing to be:"  
			\*answers: arousalScale  
			\*save: teasing

		\*question: "I find scenarios where I eagerly beg others to be:"  
			\*answers: arousalScale  
			\*save:begging1

		\*question: "I find scenarios where others eagerly beg me to be:"  
			\*answers: arousalScale  
			\*save:begging2  
	\*question: "I find sexual frustration to be:"  
			\*answers: arousalScale  
			\*save:frustration

		\*question: Which of the following do you find erotic?  
			\*type: checkbox  
			Accidental arousal (e.g., riding a bike)  
			Worshipping female body parts  
			Worshipping male body parts  
			Strip teases  
			Eager service (e.g., giving foot massages)  
			Streaking  
			Trying to get impregnated  
			Heat/rutting (in the way animals "go into heat")  
			Intentionally revealing clothing  
			\*save: eager2

\*if: "Exhibitionism/voyeurism (peeping tom, flashing, public sex, etc.)"	in fetish1  
	\*question: "I find being a sexual exhibitionist to be:"  
		\*tip: This means 'showing off sexuality', typically publicly, like streaking or public sex  
		\*answers: arousalScale  
		\*save:exhibitionself

	\*question: "I find others being sexual exhibitionists to be:"  
		\*tip: This means 'showing off sexuality', typically publicly, like streaking or public sex  
		\*answers: arousalScale  
		\*save:exhibitionother

	\*question: "I find being a voyeur to be:"  
		\*tip: This means 'watching others sexually', typically publicly or without permission, such as peeping toms  
		\*answers: arousalScale  
		\*save: voyeurself

	\*question: "I find others being voyeurs to be:"  
		\*tip: This means 'showing off sexuality', typically publicly or without permission, such as peeping toms  
		\*answers: arousalScale  
		\*save:voyeurother

	\*question: How old were you when you first experienced sexual interest in exhibitionism or voyeurism?  
		\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
		0-4yo  
			\>\>voyeurexhbfetishstart \= 4  
		5-6yo  
			\>\>voyeurexhbfetishstart \= 5  
		7-8yo  
			\>\>voyeurexhbfetishstart \= 7  
		9-10yo  
			\>\>voyeurexhbfetishstart \= 9  
		11-12yo  
			\>\>voyeurexhbfetishstart \= 11  
		13-14yo  
			\>\>voyeurexhbfetishstart \= 13  
		15-16yo  
			\>\>voyeurexhbfetishstart \= 15  
		17-18yo  
			\>\>voyeurexhbfetishstart \= 17  
		19-25yo  
			\>\>voyeurexhbfetishstart \= 19  
		26yo+  
			\>\>voyeurexhbfetishstart \= 27  
			

\*if: "Genderplay (sissification, futa, crossdressing, etc.)" in fetish2  
	\*question: "I find sexual scenarios involving genderplay to be:"  
		\*tip: If you find one specific type of genderplay to be erotic (for example, crossdressing, futa, or sissification), then answer with just that in mind, not the whole category.  
		\*answers: arousalScale  
		\*save: genderplay  
		  
	\*if: genderplay \> 0  
		\*question: How old were you when you first experienced interest in genderplay related sexual interests?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>genderfetishstart \= 4  
			5-6yo  
				\>\>genderfetishstart \= 5  
			7-8yo  
				\>\>genderfetishstart \= 7  
			9-10yo  
				\>\>genderfetishstart \= 9  
			11-12yo  
				\>\>genderfetishstart \= 11  
			13-14yo  
				\>\>genderfetishstart \= 13  
			15-16yo  
				\>\>genderfetishstart \= 15  
			17-18yo  
				\>\>genderfetishstart \= 17  
			19-25yo  
				\>\>genderfetishstart \= 19  
			26yo+  
				\>\>genderfetishstart \= 27  
				  
		\*question: "I find futanari to be:"  
			\*tip: Futa is "women with penises," typically depicted in hentai or animation  
			\*answers: arousalScale  
			\*save:futa

		\*question: "I find it most erotic when the subject of my genderplay interest is:"  
			Me  
			The other person

\--adding misgendering 11/19/2024  
		\*question: Which of the following do you find erotic?  
			\*type: checkbox  
			Crossdressing (passably; people can't tell)  
			Crossdressing (nonpassing, people can tell)  
			Acting like the opposite gender  
			Drag Queens  
			Transgenderism  
			Sissification (degredation by feminization)  
			Gender dysphoria  
			Androgyny  
			Hermaphroditism   
			Detransitioning  
			Misgendering  
			\*save: genderplay2

\*if: "Gentleness (caretaking, healing, tantra, etc.)" in fetish1  
	\*question: "I find sexual scenarios involving gentleness to be:"  
		\*tip: If you find one specific type of gentle scenario to be erotic (for example, caretaking, healing, tantra), then answer with just that in mind, not the whole category.  
		\*answers: arousalScale  
		\*save: gentleness  
		  
	\*if: gentleness \> 0  
		\*question: How old were you when you first experienced interest in gentleness related sexual interests?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>gentlenessfetishstart \= 4  
			5-6yo  
				\>\>gentlenessfetishstart \= 5  
			7-8yo  
				\>\>gentlenessfetishstart \= 7  
			9-10yo  
				\>\>gentlenessfetishstart \= 9  
			11-12yo  
				\>\>gentlenessfetishstart \= 11  
			13-14yo  
				\>\>gentlenessfetishstart \= 13  
			15-16yo  
				\>\>gentlenessfetishstart \= 15  
			17-18yo  
				\>\>gentlenessfetishstart \= 17  
			19-25yo  
				\>\>gentlenessfetishstart \= 19  
			26yo+  
				\>\>gentlenessfetishstart \= 27  
				  
		\*question: Which of the following do you find erotic?  
			\*type: checkbox  
			Clear, enthusiastic consent  
			Cuddling  
			Sensual healing  
			Tantra  
			Affection  
			Romance  
			Therapeutic sexual experiences  
			Energy work  
			Caretaker/caretakee dynamics  
			\*save: gentleness2

\*if: "Humiliation (defilement, impotence, cuckoldry, ridicule, etc.)" in fetish1  
	\*question: "I find sexual scenarios involving humiliation to be:"  
		\*tip: If you find one specific type of humiliation scenario to be erotic (for example, defilement, impotence, ridicule, etc.), then answer with just that in mind, not the whole category.  
		\*answers: arousalScale  
		\*save: humiliation  
	  
	\*if: humiliation \> 0  
		\*question: How old were you when you first experienced interest in humiliation related sexual interests?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>humiliationfetishstart \= 4  
			5-6yo  
				\>\>humiliationfetishstart \= 5  
			7-8yo  
				\>\>humiliationfetishstart \= 7  
			9-10yo  
				\>\>humiliationfetishstart \= 9  
			11-12yo  
				\>\>humiliationfetishstart \= 11  
			13-14yo  
				\>\>humiliationfetishstart \= 13  
			15-16yo  
				\>\>humiliationfetishstart \= 15  
			17-18yo  
				\>\>humiliationfetishstart \= 17  
			19-25yo  
				\>\>humiliationfetishstart \= 19  
			26yo+  
				\>\>humiliationfetishstart \= 27  
				  
		\*question: In general, you find it most erotic when the subject of humiliation is:  
			Me  
			Someone else  
			  
		\*question: Which of the following do you find erotic, in the context of humiliation?  
			\*type: checkbox  
			Castration  
			Cuckoldry  
			Defilement (to corrupt, dirty, violate)  
			Facesitting  
			Flaccid play  
			Forced consumption of undesireable things  
			Forced consumption of desireable things  
			Humiliation for sexual inexperience  
			Humiliation for sluttiness  
			Impotence  
			Insults  
			Objectification  
			Photography/videography  
			Public humiliation  
			Religious humiliation  
			Scat  
			Small penis humiliation  
			Other body part humiliation  
			Urine  
			Verbal degredation  
			Writing on bodies  
			\*save: humiliation2

\*if: "Incest (cousins, parent/child, etc.)" in fetish1  
	\*question: "I find sexual scenarios involving incest to be:"  
		\*tip: If you find one specific type of incest scenario to be erotic (for example, cousins, parent/child, etc.), then answer with just that in mind, not the whole category.  
		\*answers: arousalScale  
		\*save: incest  
		  
			  
	\*if: incest \> 0  
		\*question: How old were you when you first experienced interest in incest?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>inceststart \= 4  
			5-6yo  
				\>\>inceststart \= 5  
			7-8yo  
				\>\>inceststart \= 7  
			9-10yo  
				\>\>inceststart \= 9  
			11-12yo  
				\>\>inceststart \= 11  
			13-14yo  
				\>\>inceststart \= 13  
			15-16yo  
				\>\>inceststart \= 15  
			17-18yo  
				\>\>inceststart \= 17  
			19-25yo  
				\>\>inceststart \= 19  
			26yo+  
				\>\>inceststart \= 27  
				  
		\*question: When it comes to incest, you find scenarios where the people are related by \_\_\_\_ to be most erotic  
			\*type: slider  
			\*before: Marriage (not genetically)  
			\*after: Blood (genetically)  
			\*save: marriage100blood

		\*question: Which of the following pairings do you find erotic?  
			\*tip: Assume they are either not blood related or blood related, depending on your preference  
			\*type: checkbox  
			Parent/child  
			Grandparent/grandchild  
			Siblings  
			Aunt/uncle, niece/nephew  
			\*save: incest2

		\*if: "Parent/child" in incest2  
			\*question: For parent/child incest fantasies, which are your preferred pairings  
				\*type: checkbox  
				Mother and daughter  
				Mother and son  
				Father and daughter  
				Father and son  
				Mother/father together and daughter  
				Mother/father together and son  
				Mother and daughter/son together  
				Father and daughter/son together  
				\*save: incest3

		\*if: "Grandparent/grandchild" in incest2  
			\*question: For grandparent/grandchild incest fantasies, which is your preferred pairing  
				\*type: checkbox  
				Grandmother and granddaughter  
				Grandmother and grandson  
				Grandfather and granddaughter  
				Grandfather and grandson  
				Grandmother/father together and granddaughter  
				Grandmother/father together and grandson  
				Grandmother and granddaughter/grandson together  
				Grandfather and granddaughter/grandson together  
			  
	  
		\*if: "Siblings" in incest2  
			\*question: For sibling incest fantasies, which is your preferred pairing  
				\*type: checkbox  
				brother/sister  
				brother/sister (with age gap)  
				brother/brother  
				brother/brother (with age gap)  
				sister/sister  
				sister/sister (with age gap)  
				\*save: siblings  
				  
			\*if: "brother/sister" in siblings  
				\>\>incestanswers.add(515\*incest)  
			\*if: "brother/sister (with age gap)" in siblings  
				\>\>incestanswers.add(615\*incest)	  
			\*if: "brother/brother" in siblings  
				\>\>incestanswers.add(676\*incest)  
			\*if: "brother/brother (with age gap)" in siblings  
				\>\>incestanswers.add(776\*incest)	  
			\*if: "sister/sister" in siblings  
				\>\>incestanswers.add(451\*incest)  
			\*if: "sister/sister (with age gap)" in siblings  
				\>\>incestanswers.add(551\*incest)	

		\*if: "Aunt/uncle, niece/nephew" in incest2  
			\*question: For aunt/uncle, niece/nephew incest fantasies, which is your preferred pairing  
				\*type: checkbox  
				aunt/nephew  
				aunt/niece  
				uncle/nephew  
				uncle/niece  
				

\*if: "Mental Alteration (hypnotism/mind control, amnesia, cocaine, etc.)" in fetish2  
	\*question: "I find sexual scenarios involving mental alteration to be:"  
		\*tip: If you find one specific type of mental alteration scenario to be erotic (for example, hypnotism, mind control, amnesia, cocaine, etc.), then answer with just that in mind, not the whole category.  
		\*answers: arousalScale  
		\*save: mentalalteration  
	  
	\*if: mentalalteration \> 0  
		\*question: How old were you when you first experienced sexual interest in mental alteration?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>mentalaltfetishstart \= 4  
			5-6yo  
				\>\>mentalaltfetishstart \= 5  
			7-8yo  
				\>\>mentalaltfetishstart \= 7  
			9-10yo  
				\>\>mentalaltfetishstart \= 9  
			11-12yo  
				\>\>mentalaltfetishstart \= 11  
			13-14yo  
				\>\>mentalaltfetishstart \= 13  
			15-16yo  
				\>\>mentalaltfetishstart \= 15  
			17-18yo  
				\>\>mentalaltfetishstart \= 17  
			19-25yo  
				\>\>mentalaltfetishstart \= 19  
			26yo+  
				\>\>mentalaltfetishstart \= 27  
			  
		\*question: You prefer it when the mentally altered person is:  
			Me  
			Other people  
			Both  
			\*save:whoisaltered  
			  
		\*question: Which of the following types of mental alteration do you find erotic?  
			\*type: checkbox  
			Mental disabilities  
			Hypnotism  
			Brainwashing  
			Trance states  
			Dronification  
			Mind control  
			Sleeping  
			Amnesia  
			Drunkenness  
			Drugs  
			\*save: mentalalteration2

		\*if: "Drugs" in mentalalteration2  
			\*question: Which of the following drugs are erotic in sexual situations?  
				\*type: checkbox  
				Aphrodesiacs (arousal drugs)  
				Psychedelics  
				Roofies  
				Poppers  
				Meth  
				Ecstasy  
				Cocaine  
				Heroin  
				\*save:drugs

\*if: "Multiple partners (hotwifing, gangbangs, freeuse, threesomes, etc.)" in fetish1  
	\*question: "I find sexual scenarios involving multiple partners to be:"  
		\*tip: If you find one specific type of multiple partner scenario to be erotic (for example, gangbangs, cuckolding, freeuse, etc.), then answer with just that in mind, not the whole category.  
		\*answers: arousalScale  
		\*save: multiplepartners

			  
	\*if: multiplepartners \> 0  
		\*question: How old were you when you first experienced sexual interest in multiple partners or related scenarios?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>multiplepartfetishstart \= 4  
			5-6yo  
				\>\>multiplepartfetishstart \= 5  
			7-8yo  
				\>\>multiplepartfetishstart \= 7  
			9-10yo  
				\>\>multiplepartfetishstart \= 9  
			11-12yo  
				\>\>multiplepartfetishstart \= 11  
			13-14yo  
				\>\>multiplepartfetishstart \= 13  
			15-16yo  
				\>\>multiplepartfetishstart \= 15  
			17-18yo  
				\>\>multiplepartfetishstart \= 17  
			19-25yo  
				\>\>multiplepartfetishstart \= 19  
			26yo+  
				\>\>multiplepartfetishstart \= 27  
				  
		\*question: Which of the following do you find erotic?  
			\*type: checkbox  
			Bukkake  
			Circle jerks  
			Cheating  
			Cuckolding  
			Double penetration  
			Dogging (sex with strangers in public)  
			Freeuse (society where people casually have sex with anyone)  
			Gang bangs  
			Harems  
			Hotwifing (wife sex with others, non-humiliatingly)  
			Orgies  
			Partner swapping  
			Possessiveness (sexual partners fighting)  
			Sloppy seconds  
			Soft swinging  
			Swinging  
			Synchronized fucking  
			Threesomes  
			Triple penetration  
			\*save: multiplepartners2

\*if: "Mythical/fictional creatures (dragons, vampires, aliens, MLP, etc.)" in fetish1  
	\*question: "I find sexual scenarios involving mythical/fictional creatures to be:"  
		\*tip: If you find one specific type of mythical/fictional creatures scenario to be erotic (for example, dragons, vampires, MLP, etc.), then answer with just that in mind, not the whole category.		  
		\*answers: arousalScale  
		\*save: mythical

			  
	\*if: mythical \> 0  
		\*question: How old were you when you first experienced sexual interest in mythical creatures?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>mythicalfetishstart \= 4  
			5-6yo  
				\>\>mythicalfetishstart \= 5  
			7-8yo  
				\>\>mythicalfetishstart \= 7  
			9-10yo  
				\>\>mythicalfetishstart \= 9  
			11-12yo  
				\>\>mythicalfetishstart \= 11  
			13-14yo  
				\>\>mythicalfetishstart \= 13  
			15-16yo  
				\>\>mythicalfetishstart \= 15  
			17-18yo  
				\>\>mythicalfetishstart \= 17  
			19-25yo  
				\>\>mythicalfetishstart \= 19  
			26yo+  
				\>\>mythicalfetishstart \= 27  
				  
		\*question: Which of the following do you find erotic?  
			\*type: checkbox  
			Aliens  
			Angels  
			Cartoons  
			Demons  
			Dinosaurs  
			Dragons  
			Elves/fae  
			Hentai characters  
			Ghosts  
			Jesus  
			My Little Pony characters  
			Orcs/ogres/golems  
			Robots/cyborgs  
			Slime/goo people  
			Superhero/villain characters  
			Undead (zombies)  
			Unicorns  
			Vampires  
			Video game characters  
			Werewolves  
			\*save: mythical2

\*if: "Nonconsent (rapeplay, body control, kidnapping, etc.)" in fetish1  
	\*question: "I find sexual scenarios involving nonconsent to be:"  
		\*tip: If you find one specific type of nonconsent scenario to be erotic (for example, rapeplay, body control, kidnapping, etc.), then answer with just that in mind, not the whole category.		  
		\*answers: arousalScale  
		\*save: nonconsent

			  
	\*if: nonconsent \> 0  
		\*question: How old were you when you first experienced sexual interest in nonconsent?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>nonconfetishstart \= 4  
			5-6yo  
				\>\>nonconfetishstart \= 5  
			7-8yo  
				\>\>nonconfetishstart \= 7  
			9-10yo  
				\>\>nonconfetishstart \= 9  
			11-12yo  
				\>\>nonconfetishstart \= 11  
			13-14yo  
				\>\>nonconfetishstart \= 13  
			15-16yo  
				\>\>nonconfetishstart \= 15  
			17-18yo  
				\>\>nonconfetishstart \= 17  
			19-25yo  
				\>\>nonconfetishstart \= 19  
			26yo+  
				\>\>nonconfetishstart \= 27  
				

		\*question: In erotic scenarios involving nonconsent, you generally prefer when the nonconsenting person is:  
			Me  
			Someone else  
			\*save:consentrole  
				  
		\*question: Which of the following nonconsent scenarios do you find erotic?  
			\*type: checkbox  
			Abductions/kidnappings  
			Body control (directly controlling a body, e.g. voodoo)  
			Coercion/blackmail  
			Dub-consensual (unclear consent)  
			Forced nudity  
			Forced orgasms  
			Frotteurism (e.g. humping in a crowded subway)  
			Inebriation  
			Rapeplay  
			Sex trafficking  
			Sexual slavery  
			Struggling/fighting  
			Slave auctions  
			Stalking  
			Wartime raids  
			Weapon threats (e.g. gunplay)  
			\*save: nonconsent1

\*if: "Objects: nonstandard (hairbrushes, rope, cars, etc.)" in fetish2  
	\*question: "I find sexual scenarios involving specific objects to be:"  
		\*tip: If you find one specific type of object to be erotic (for example, hairbrushes, rope, cars, etc.), then answer with just that in mind, not the whole category. This is about objects that are \*inherently\* erotic to you, in a similar way to finding breasts inherently erotic.  
		\*answers: arousalScale  
		\*save: objects

			  
	\*if: objects \> 0  
		\*question: How old were you when you first experienced sexual interest in your preferred object/objects?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>objectsfetishstart \= 4  
			5-6yo  
				\>\>objectsfetishstart \= 5  
			7-8yo  
				\>\>objectsfetishstart \= 7  
			9-10yo  
				\>\>objectsfetishstart \= 9  
			11-12yo  
				\>\>objectsfetishstart \= 11  
			13-14yo  
				\>\>objectsfetishstart \= 13  
			15-16yo  
				\>\>objectsfetishstart \= 15  
			17-18yo  
				\>\>objectsfetishstart \= 17  
			19-25yo  
				\>\>objectsfetishstart \= 19  
			26yo+  
				\>\>objectsfetishstart \= 27  
				  
		\*question: Which of the following do you find erotic?  
			\*tip: Again, this is \*inherently\* erotic; if it's only hot when incorporated into a normally sexual context (e.g., bras being hot when being taken off breasts), this doesn't count.  
			\*type: checkbox  
			Airplanes/cars  
			Buildings  
			Chains  
			Clothing  
			Condoms (unused)  
			Condoms (used)  
			Dolls		  
			Food  
			Hairbrushes/clips/scrunchies  
			Inflatables (e.g., balloons)  
			Nature (plants, mushrooms, etc.)  
			Plants  
			Plushies  
			Realdolls  
			Robots  
			Rope  
			Guns  
			Statues/mannequins  
			Other  
			\*save: objects2

\*if: "Power dynamics & D/s (obedience, findom, petplay, choking, etc.)" in fetish1  
	\*question: "I find sexual scenarios involving power dynamics to be:"  
		\*tip: If you find one specific type of power dynamic to be erotic (obedience, findom, petplay, choking, etc.), then answer with just that in mind, not the whole category.   
		\*answers: arousalScale  
		\*save: powerdynamic

		  
	\*if: powerdynamic \> 0  
		\*question: How old were you when you first experienced sexual interest in power dynamics?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>powerdynamicfetishstart \= 4  
			5-6yo  
				\>\>powerdynamicfetishstart \= 5  
			7-8yo  
				\>\>powerdynamicfetishstart \= 7  
			9-10yo  
				\>\>powerdynamicfetishstart \= 9  
			11-12yo  
				\>\>powerdynamicfetishstart \= 11  
			13-14yo  
				\>\>powerdynamicfetishstart \= 13  
			15-16yo  
				\>\>powerdynamicfetishstart \= 15  
			17-18yo  
				\>\>powerdynamicfetishstart \= 17  
			19-25yo  
				\>\>powerdynamicfetishstart \= 19  
			26yo+  
				\>\>powerdynamicfetishstart \= 27  
				

		\*question: When it comes to power dynamics, you tend to prefer scenarios that are more  
			Very caring/gentle  
				\>\>brutal \= \-3  
			Moderately caring/gentle  
				\>\>brutal \= \-2  
			Slightly caring/gentle  
				\>\>brutal \= \-1  
			Equally brutal and caring  
				\>\>brutal \= 0  
			Slightly brutal/cruel  
				\>\>brutal \= 1  
			Moderately brutal/cruel  
				\>\>brutal \= 2  
			Very brutal/cruel  
				\>\>brutal \= 3  
	  
		\*question: "I find primal play to be:"  
			\*tip: Primal play is a rough, animalistic form of sex, and can include scratching, biting, growling, and wrestling. In power dynamics, sometimes referred to as "hunter" and "prey"  
			\*answers: arousalScale  
			  
		\*question: "I find dynamics centered around obedience, training, and punishment, to be:"  
			\*answers: arousalScale  
			\*save: obedience

		  
			  
		\*question: "I find dynamics centered around mindbreaking to be:"  
			\*tip: Mindbreaking typically centers around 'breaking will,' 'erasing resistence,' or 'mentally enslaving'  
			\*answers: arousalScale  
			\*save:mindbreak

		  
		\*question: "I find master/slave dynamics to be:"  
			\*answers: arousalScale  
			\*save:masterslave  
			  
		\*if: gendermale \= 1  
			\*if: dom \> \-1  
				\>\>poweranswers.add(138\*masterslave)  
			\*if: dom \< 0  
				\>\>poweranswers.add(251\*masterslave)  
		\*if: gendermale \= 0  
			\*if: dom \> \-1  
				\>\>poweranswers.add(135\*masterslave)  
			\*if: dom \< 0  
				\>\>poweranswers.add(149\*masterslave)			  
			  
			  
			  
		\*question: "I find power dynamics extend into everyday life to be:"  
			\*tip: e.g., 24/7 play, may involve things like restrictions on nonsexual behavior (such as chores or clothing to wear)  
			\*answers: arousalScale  
			\*save: fulltimepower  
			

		  
			  
		\*question: Which of the following do you find erotic?  
			\*type: checkbox  
			Behavioral restrictions (e.g. limits on speech)  
			Bootblacking (polishing shoes submissively)  
			Breath play (choking, asphyxiation)  
			Disempowerment (stripping power away from a powerful person)  
			Financial domination  
			Internal Enslavement (behavioral restrictions are internally imposed/fully trained)  
			Orgasm denial  
			Orgasm overload  
			Ownership  
			Petplay (master/pet roleplay)  
			Physical struggle/overpowering (e.g., pinning)  
			Powerbottoming (enthusiastic submissive, often queer)  
			Marking as property (e.g., branding, collars)  
			Service/utility submission (performing service tasks)  
			Sexual education  
			Sexual training (e.g., to give deeper blowjobs)  
			World of maledom  
			World of femaledom  
			\*save: powerdynamic2

\*if: "Reproduction (pregnancy, surrogacy, oviposition, etc.)" in fetish2  
	\*question: "I find sexual scenarios involving reproduction to be:"  
		\*tip: If you find one specific type of power dynamic to be erotic (pregnancy, surrogacy, oviposition, etc.), then answer with just that in mind, not the whole category.   
		\*answers: arousalScale  
		\*save: pregnancy

			  
	\*if: pregnancy \> 0  
		\*question: How old were you when you first experienced interest in pregnancy related sexual interests?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>pregnancyfetishstart \= 4  
			5-6yo  
				\>\>pregnancyfetishstart \= 5  
			7-8yo  
				\>\>pregnancyfetishstart \= 7  
			9-10yo  
				\>\>pregnancyfetishstart \= 9  
			11-12yo  
				\>\>pregnancyfetishstart \= 11  
			13-14yo  
				\>\>pregnancyfetishstart \= 13  
			15-16yo  
				\>\>pregnancyfetishstart \= 15  
			17-18yo  
				\>\>pregnancyfetishstart \= 17  
			19-25yo  
				\>\>pregnancyfetishstart \= 19  
			26yo+  
				\>\>pregnancyfetishstart \= 27  
				  
		\*question: Which of the following is erotic?  
			\*type: checkbox  
			Anal pregnancy  
			Breeding/impregnation  
			Extreme pregnancy (huge/unusual fetuses)  
			Male pregnancy  
			Ovisposition (laying eggs into someone/birthing the eggs)  
			Pregnancy  
			Surrogacy  
			\*save: pregnancy2

\*if: "Roles (secretary, asians, catgirls, teachers, stoners, etc.)" in fetish1  
	\*question: "I find sexual scenarios involving specific roles (like secretaries, asians, catgirls, etc.) to be:"  
		\*tip: If you find one specific type of role to be erotic, then answer with just that in mind, not the whole category.   
		\*answers: arousalScale  
		\*save: roles

			  
	\*if: roles \> 0  
		\*question: How old were you when you first experienced sexual interest in specific roles?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>rolesfetishstart \= 4  
			5-6yo  
				\>\>rolesfetishstart \= 5  
			7-8yo  
				\>\>rolesfetishstart \= 7  
			9-10yo  
				\>\>rolesfetishstart \= 9  
			11-12yo  
				\>\>rolesfetishstart \= 11  
			13-14yo  
				\>\>rolesfetishstart \= 13  
			15-16yo  
				\>\>rolesfetishstart \= 15  
			17-18yo  
				\>\>rolesfetishstart \= 17  
			19-25yo  
				\>\>rolesfetishstart \= 19  
			26yo+  
				\>\>rolesfetishstart \= 27  
				  
		\*question: Which of the following categories contains things you find erotic?  
			\*type: checkbox  
			Professions (e.g., firefighter, nurse, cheerleader)  
			Stereotypes (e.g., nerd, jock)  
			Races (ethnicity)  
			\*save: roles2  
\--raceplay added 10/3/24, 3:36pm  
		\*question:You find raceplay to be:  
			\*answers:arousalScale  
		\*if: "Professions (e.g., firefighter, nurse, cheerleader)" in roles2  
			\*question: Which of the following roles are erotic?  
				\*type: checkbox  
				Atheletes  
				Babysitter  
				Catboys  
				Catgirls  
				Celebrities  
				Cheerleaders  
				Criminals  
				Doctors  
				Escorts/prostitutes  
				Geishas  
				Gigolos  
				Gynecologists  
				Librarians  
				Maids  
				Nazis  
				Nuns  
				Nurses  
				Priests  
				Scientists  
				Strippers  
				Students  
				Teachers  
				\*save: profession

		\*if: "Stereotypes (e.g., nerd, jock)" in roles2  
			\*question: Which of the following do you find erotic?  
				\*type: checkbox  
				Artists  
				Geeks/nerds  
				Jocks  
				Neurotic mothers  
				"Popular kids"  
				Punks/goths  
				Stoners  
				Theater people  
	

		\*if: "Races (ethnicity)" in roles2  
			\*question: Which of the following do you find erotic?  
				\*type: checkbox  
				Asians  
				Black people  
				Caucasians  
				East asians  
				Middle eastern/arabic  
				Native americans  
				Scandinavians  
				Southeast asians  
				Pacific islanders  
				\*save: sexyrace

\*if: "Sadomasochism (spanking, needle play, clamps, torture, etc.)" in fetish1  
	\*question: "I find sexual scenarios involving sadomasochism to be:"  
		\*tip: If you find one specific type of sadomasochism to be erotic (spanking, needle play, clamps, etc.), then answer with just that in mind, not the whole category.   
		\*answers: arousalScale  
		\*save: sadomasochism

			  
	\*if: sadomasochism \> 0  
		\*question: How old were you when you first experienced sexual interest in sadomasochism?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>sadomasofetishstart \= 4  
			5-6yo  
				\>\>sadomasofetishstart \= 5  
			7-8yo  
				\>\>sadomasofetishstart \= 7  
			9-10yo  
				\>\>sadomasofetishstart \= 9  
			11-12yo  
				\>\>sadomasofetishstart \= 11  
			13-14yo  
				\>\>sadomasofetishstart \= 13  
			15-16yo  
				\>\>sadomasofetishstart \= 15  
			17-18yo  
				\>\>sadomasofetishstart \= 17  
			19-25yo  
				\>\>sadomasofetishstart \= 19  
			26yo+  
				\>\>sadomasofetishstart \= 27  
				  
		\*question: "In erotic contexts, I find \*receiving\* pain to be:"  
			\*answers: arousalScale  
			\*save: receivepain

		\*question: "In erotic contexts, I find \*giving\* pain to others to be:"  
			\*answers: arousalScale  
			\*save:givepain	  
				  
		\*question: I find spanking to be  
			\*answers: arousalScale  
			\*save: spanking

		\*question: How important is it that the pain is also sexually gratifying to the recipient?  
			\*tip: General reminder: answer for your fantasies; we know what you do in real life may be different  
			Very important  
				\>\>paingratification \= 3  
			Moderately important  
				\>\>paingratification \= 2  
			Slightly important  
				\>\>paingratification \= 1  
			Not important  
				\>\>paingratification \= 0  
			Actively prefer ungrafitying pain  
				\>\>paingratification \= \-1  
			  
		\*question: "I find psychological pain/torture to be:"  
			\*tip: General reminder: answer for your fantasies; we know what you do in real life may be different  
			\*answers: arousalScale  
			\--Added Sounding on 3/9/24, 8:56 am  
		\*question: Which of the following types of sadomasochism do you find erotic?"  
			\*type: checkbox  
			Biting/scratching/scrapes  
			Breaking skin (needles, cutting, etc.)  
			Burning (figging, hot wax, fireplay etc.)  
			Clamping/pinching  
			Discomfort (punishment ties, achey knees, etc.)  
			Electricity/tingling  
			Impact: thuddy (e.g., paddle, flogger, fist)  
			Impact: stingy (e.g. riding crop, belt)  
			Pumps  
			Punching  
			Sexual exhaustion (e.g., long sex until raw, then continuing)  
			Sharp (wartenberg wheels, getting poked, etc.)  
			Slapping  
			Sounding  
			Stinging (insects, nettles, etc.)  
			Stretching (e.g., huge insertions)  
			Squeezing/compression (stepping on balls, heavy weight, etc.)  
			\*save: sadomasochism1

			  
		\*question: "Scenarios where pain is given to genitals are arousing to me"  
			\*tip: For example, slapping a vagina or penis  
			\*answers: arousalScale  
			  
		\*question: "In general, I prefer scenarios where the intensity of the pain is:"  
			Very mild  
				\>\>painintensity \= \-3  
			Moderately mild  
				\>\>painintensity \= \-2  
			Slightly mild  
				\>\>painintensity \= \-1  
			Equally mild and severe  
				\>\>painintensity \= 0  
			Slightly severe  
				\>\>painintensity \= 1  
			Moderately severe  
				\>\>painintensity \= 2  
			Very severe  
				\>\>painintensity \= 3

		\*question: "In general, I prefer scenarios where receiver of the pain is:"  
			\*tip: General reminder: answer for your fantasies; we know what you or want to happen to you in real life may be different  
			Very eager/wants it  
				\>\>painreceiveeager \= 3  
			Moderately eager/wants it  
				\>\>painreceiveeager \= 2  
			Slightly eager/wants it  
				\>\>painreceiveeager \= 1  
			Slightly upset/doesn't want it  
				\>\>painreceiveeager \= \-1  
			Moderately upset/doesn't want it  
				\>\>painreceiveeager \= \-2  
			Very upset/doesn't want it  
				\>\>painreceiveeager \= \-3  
				

\*if: "Sensory (electricity, vacuums, ASMR, tickling, etc.)" in fetish1  
	\*question: "I find sexual scenarios involving sensory play to be:"  
		\*tip: If you find one specific type of sensory play to be erotic (electricity, vacuums, fireplay.), then answer with just that in mind, not the whole category.   
		\*answers: arousalScale  
		\*save: sensory

			  
	\*if: sensory \> 0  
		\*question: How old were you when you first experienced interest in sensory related sexual interests?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>sensoryfetishstart \= 4  
			5-6yo  
				\>\>sensoryfetishstart \= 5  
			7-8yo  
				\>\>sensoryfetishstart \= 7  
			9-10yo  
				\>\>sensoryfetishstart \= 9  
			11-12yo  
				\>\>sensoryfetishstart \= 11  
			13-14yo  
				\>\>sensoryfetishstart \= 13  
			15-16yo  
				\>\>sensoryfetishstart \= 15  
			17-18yo  
				\>\>sensoryfetishstart \= 17  
			19-25yo  
				\>\>sensoryfetishstart \= 19  
			26yo+  
				\>\>sensoryfetishstart \= 27  
				  
		\*question: Which of the following sensations do you find erotic?  
			\*tip: Sadomasochism was a separate category; assume these sensations are not significantly painful  
			\*type: checkbox  
			ASMR  
			Breathplay (choking, asphyxiation)  
			Constriction/compression  
			Cupping  
			Earplugs/blindfolds  
			Electricity  
			Feathers  
			Messiness/goo/mud  
			Oil/lotion  
			Pumps (e.g., breast/penile pumps)  
			Sensory deprivation  
			Scratching  
			Smells (good)  
			Smells (bad)  
			Spicy/tingling  
			Stretching/fullness  
			Stuffing (nonfood, typically in genitals)  
			Temperature (hot)  
			Temperature (cold)  
			Texture (rough)  
			Texture (soft)  
			Tickling  
			Vacuum/suckage  
			Wax play  
			\*save: sensory2

\*if: "Toys (anal beads, pussy pumps, showerheads, etc.)" in fetish1  
	\*question: "I find sexual scenarios involving sex toys to be:"  
		\*tip: If you find one specific type of sex toy to be erotic (anal beads, pussy pumps, showerheads, etc), then answer with just that in mind, not the whole category.   
		\*answers: arousalScale  
		\*save: toys

			  
	\*if: toys \> 0  
		\*question: How old were you when you first experienced interest in scenarios involving sex toys?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>toysfetishstart \= 4  
			5-6yo  
				\>\>toysfetishstart \= 5  
			7-8yo  
				\>\>toysfetishstart \= 7  
			9-10yo  
				\>\>toysfetishstart \= 9  
			11-12yo  
				\>\>toysfetishstart \= 11  
			13-14yo  
				\>\>toysfetishstart \= 13  
			15-16yo  
				\>\>toysfetishstart \= 15  
			17-18yo  
				\>\>toysfetishstart \= 17  
			19-25yo  
				\>\>toysfetishstart \= 19  
			26yo+  
				\>\>toysfetishstart \= 27  
				  
		\*question: Which of the following do you find erotic?  
			\*type: checkbox  
			Anal beads  
			Anal dildos (normal)  
			Anal dildos (huge)  
			Anal hooks  
			Buttplugs  
			Double ended dildos  
			Fuck machines  
			Pumps (breast)  
			Pumps (penis)  
			Pumps (pussy)  
			Remote control toys  
			Sex swings  
			Showerheads  
			Speculums  
			Strap-ons  
			Sybians  
			TENS/PENS units  
			Vaginal dildos (normal)  
			Vaginal dildos (huge)  
			Vibrators  
			Weights  
			\*save: toys2

		\*question: My erotic fantasies involving toys typically involve \_\_\_\_ using the toys  
			Totally me  
			Mostly me  
			Me and the other person equally  
			Mostly the other person  
			Totally the other person

\*if: "Transformations (growth/shrinking, bodyswapping, furries, etc.)" in fetish2  
	\*question: "I find sexual scenarios involving transformations to be:"  
		\*tip: If you find one specific type of transformation to be erotic (growth/shrinking, bodyswapping, shapeshifting, etc), then answer with just that in mind, not the whole category.   
		\*answers: arousalScale  
		\*save: transform

			  
	\*if: transform \> 0  
		\*question: How old were you when you first experienced interest in transformation related sexual interests?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>transformfetishstart \= 4  
			5-6yo  
				\>\>transformfetishstart \= 5  
			7-8yo  
				\>\>transformfetishstart \= 7  
			9-10yo  
				\>\>transformfetishstart \= 9  
			11-12yo  
				\>\>transformfetishstart \= 11  
			13-14yo  
				\>\>transformfetishstart \= 13  
			15-16yo  
				\>\>transformfetishstart \= 15  
			17-18yo  
				\>\>transformfetishstart \= 17  
			19-25yo  
				\>\>transformfetishstart \= 19  
			26yo+  
				\>\>transformfetishstart \= 27  
				  
		\*question: "I find situations erotic where transformations are \_\_\_"  
			\*type: slider  
			\*before: Unintentional/forced  
			\*after: Intentional/chosen  
			  
		\*question: Which of the following categories of transformations do you find erotic?  
			\*type: checkbox  
			Age transformations (rapid aging)  
			Age transformations (rapid deaging)  
			Animal transformations  
			Body transformation (general)  
			Body parts transformation  
			Body swapping  
			Furries  
			Gender transform (female to male)  
			Gender transform (male to female)  
			Inanimate transformations  
			Possession  
			Shapeshifting  
			\*save: transform1

		\*if: "Animal transformations" in transform1  
			\*question: For animal transformations, you prefer when the final result is \_\_\_\_?  
				\*tip: "feral" is "full animal", whereas anthro maintains some human characteristics  
				\*type: slider  
				\*before: Feral  
				\*after: Anthro  
			  
		\*if: "Animal transformations" in transform1  
			\*question: For animal transformations, which of the following are the most erotic to you?  
				\*type: checkbox  
				Dogs  
				Cats  
				Goats/Sheep/Pigs  
				Monkeys  
				Bears/lions  
				Wolves  
				Horses/ponies  
				Octopi/squid  
				Parasites/leeches  
				Fish/sharks  
				Insects/arachnids  
				Amphibians  
				Dolphins/whales  
				Birds  
				Slugs/snails/worms  
				Reptiles  
				Foxes  
				Rodents  
				\*save: transform2

		\*if: "Body transformation (general)" in transform1  
			\*question: For general body transformation, which of the following is erotic?  
				\*type: checkbox  
				Weight gain  
				Weight loss  
				Becoming giant (growing in size/height)  
				Becoming tiny (shrinking in size/height)  
				Substance changes (e.g., turning into goo)  
				Other  
				\*save:generaltransform

\*if: "Vore (consuming/being consumed, usually whole)" in fetish2  
	\*question: "I find sexual scenarios involving vore to be:"  
		\*tip: If you find one specific type of vore to be erotic, then answer with just that in mind, not the whole category.   
		\*answers: arousalScale  
		\*save: vore

			  
	\*if: vore \> 0  
		\*question: How old were you when you first experienced interest in vore related sexual interests?  
			\*tip: Including pre-puberty, proto-sexual "fascinations" that might not have been explicitly sexual yet   
			0-4yo  
				\>\>vorefetishstart \= 4  
			5-6yo  
				\>\>vorefetishstart \= 5  
			7-8yo  
				\>\>vorefetishstart \= 7  
			9-10yo  
				\>\>vorefetishstart \= 9  
			11-12yo  
				\>\>vorefetishstart \= 11  
			13-14yo  
				\>\>vorefetishstart \= 13  
			15-16yo  
				\>\>vorefetishstart \= 15  
			17-18yo  
				\>\>vorefetishstart \= 17  
			19-25yo  
				\>\>vorefetishstart \= 19  
			26yo+  
				\>\>vorefetishstart \= 27		  
				  
		\*question: What kind of vore do you find erotic?  
			\*type: checkbox  
			Hard vore (chewing, person dies in mouth)  
			Soft vore (swallowing, no digestion)  
			Soft digestive vore (swallowing with digestion)  
			Cranial vore (eating only the head)  
			Mouthplay (not swallowed, just in mouth)  
			Other  
			\*save:voretype  
			

		\*question: You find vore in which orifices to be erotic?  
			\*tip: As in, being swallowed/consumed by:  
			\*type: checkbox  
			Mouth  
			Cock  
			Breast  
			Anal  
			Vaginal (unbirth)  
			Nose  
			Ear/brain  
			Eye  
