
import {
    collection,
    DocumentData,
    getDocs,
    getFirestore,
    limit,
    orderBy,
    query,
    QuerySnapshot,
    startAfter,
    where,
} from 'firebase/firestore'
import { Question } from '../../models/Question'
import { useEffect, useRef, useState } from 'react'
import { useAuthentication } from '../../hooks/authentication'
import dayjs from 'dayjs'
import Link from 'next/link'
import Layout from '../../components/Layout'

export default function QuestionsReceived() {
    const { user } = useAuthentication()
    const [questions, setQuestions] = useState<Question[]>([])
    const [isPaginationFinished, setIsPaginationFinished] = useState(false)

    const scrollContainerRef = useRef(null)

    function createBaseQuery() {
        const db = getFirestore()
        return query(
            collection(db, 'questions'),
            where('receiverUid', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(10)
        )
    }

    function appendQuestions(snapshot: QuerySnapshot<DocumentData>) {
        const gotQuestions = snapshot.docs.map((doc) => {
            const question = doc.data() as Question
            question.id = doc.id
            return question
        })
        setQuestions(questions.concat(gotQuestions))
    }

    async function loadQuestions() {
        console.log('load')
        const snapshot = await getDocs(createBaseQuery())

        if (snapshot.empty) {
            setIsPaginationFinished(true)
            return
        }

        appendQuestions(snapshot)
    }

    async function loadNextQuestions() {
        if (questions.length === 0) {
            return
        }

        const lastQuestion = questions[questions.length - 1]
        const snapshot = await getDocs(
            query(createBaseQuery(), startAfter(lastQuestion.createdAt))
        )

        if (snapshot.empty) {
            setIsPaginationFinished(true)
            return
        }

        appendQuestions(snapshot)
    }

    useEffect(() => {
        if (user === null) {
            console.log('user is null')
            return
        }

        loadQuestions()
    }, [user])

    function onScroll() {
        if (isPaginationFinished) {
            return
        }

        const container = scrollContainerRef.current
        if (container === null) {
            return
        }

        const rect = container.getBoundingClientRect()
        if (rect.top + rect.height > window.innerHeight) {
            // リストの下端がwindowの下端より下にある場合
            return
        }

        loadNextQuestions()
    }

    useEffect(() => {
        window.addEventListener('scroll', onScroll)
        return () => {
            window.removeEventListener('scroll', onScroll)
        }
    }, [questions, scrollContainerRef.current, isPaginationFinished])

    return (
        <Layout>
            <h1 className="h4">受け取った質問一覧</h1>

            <div className="row justify-content-center">
                <div className="col-12 col-md-6" ref={scrollContainerRef}>
                    {questions.map((question) => (
                        <Link href={`/questions/${question.id}`} key={question.id}>
                            <a>
                                <div className="card my-3" key={question.id}>
                                    <div className="card-body">
                                        <div className="text-truncate">{question.body}</div>
                                        <div className="text-muted text-end">
                                            <small>{dayjs(question.createdAt.toDate()).format('YYYY/MM/DD HH:mm')}</small>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </Link>
                    ))}
                </div>
            </div>
        </Layout>
    )
}